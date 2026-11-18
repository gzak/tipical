using Google.Maps.Places.V1;
using Grpc.Core;
using Microsoft.Extensions.Logging;
using Tipical.Core.DTOs;
using Tipical.Core.Repositories;
using Tipical.Core.Models;
using Tipical.Core.Services;
using Tipical.Infrastructure.Data;

namespace Tipical.Infrastructure.Services;

public class BusinessService(
    IBusinessRepository businessRepository,
    IGooglePlacesService googlePlacesService,
    ILogger<BusinessService> logger) : IBusinessService
{
    private const int MaxResults = 20;
    private const int MaxPhotos = 5;
    private static readonly TimeSpan SyncStalenessWindow = TimeSpan.FromDays(30);

    public async Task<List<BusinessPinResponse>> PlaceDetailSearchAsync(string placeId, string sessionToken)
    {
        Place place;
        try { place = await googlePlacesService.GetPlaceAsync(placeId, sessionToken); }
        catch (RpcException) { return []; }

        var businessByPlaceId = await businessRepository.GetByGooglePlaceIdsAsync([placeId]);
        await SyncStaleAsync(businessByPlaceId.Values, new() { [placeId] = place });

        var response = businessByPlaceId.TryGetValue(placeId, out var business)
            ? MapDbBusinessToResponse(business)
            : MapPlaceToResponse(place);
        return [response];
    }

    public Task<List<BusinessPinResponse>> SearchBusinessesAsync(BusinessSearchRequest request) =>
        string.IsNullOrWhiteSpace(request.Query)
            ? NearbySearchAsync(request)
            : TextSearchAsync(request);

    public async Task<BusinessDetailResponse?> GetBusinessDetailAsync(string googlePlaceId)
    {
        Place place;
        try { place = await googlePlacesService.GetPlaceDetailsAsync(googlePlaceId); }
        catch (RpcException ex)
        {
            if (ex.StatusCode == StatusCode.NotFound)
                await DeleteBusinessesAsync([googlePlaceId]);
            return null;
        }

        var isPermanentlyClosed = place.BusinessStatus == Place.Types.BusinessStatus.ClosedPermanently;
        if (isPermanentlyClosed)
            await DeleteBusinessesAsync([googlePlaceId]);

        var photos = await FetchPhotoUrisAsync(place);
        return new BusinessDetailResponse
        {
            Name = place.DisplayName.Text,
            IsPermanentlyClosed = isPermanentlyClosed,
            Rating = place.HasUserRatingCount && place.UserRatingCount > 0 ? place.Rating : null,
            ReviewCount = place.HasUserRatingCount ? place.UserRatingCount : null,
            Photos = photos,
        };
    }

    private async Task<List<BusinessPinResponse>> TextSearchAsync(BusinessSearchRequest request)
    {
        // Step 1: Places API text search is the authoritative source and ordering
        var placesResult = await googlePlacesService.SearchAsync(
            request.Query!, request.Latitude, request.Longitude, request.Radius,
            maxResultCount: MaxResults);
        var places = placesResult.Places;

        // Step 2: Correlate with DB to enrich matches with tip suggestion data
        var businessByPlaceId = await businessRepository.GetByGooglePlaceIdsAsync(
            places.Select(p => p.Id));
        await SyncStaleAsync(businessByPlaceId.Values, places.ToDictionary(p => p.Id));

        // Step 3: Build responses in Places relevance order
        return [.. places.Select(p =>
            businessByPlaceId.TryGetValue(p.Id, out var business)
                ? MapDbBusinessToResponse(business)
                : MapPlaceToResponse(p))];
    }

    private async Task<List<BusinessPinResponse>> NearbySearchAsync(BusinessSearchRequest request)
    {
        // Step 1: Query DB for known businesses near the requested location, sorted by policy priority
        var dbBusinesses = await businessRepository.SearchNearbyAsync(
            request.Latitude, request.Longitude, request.Radius, MaxResults);

        // Step 2: Backfill with Google Places if under the cap
        var placesById = new Dictionary<string, Place>();
        IEnumerable<Place> backfillPlaces = [];

        if (dbBusinesses.Count < MaxResults)
        {
            var remaining = MaxResults - dbBusinesses.Count;
            var result = await googlePlacesService.SearchNearbyAsync(
                request.Latitude, request.Longitude, request.Radius,
                maxResultCount: MaxResults);
            var places = result.Places;

            placesById = places.ToDictionary(p => p.Id);

            var knownPlaceIds = dbBusinesses.Select(b => b.GooglePlaceId).ToHashSet();
            backfillPlaces = places
                .Where(p => !knownPlaceIds.Contains(p.Id))
                .Take(remaining);
        }

        // Step 3: Bulk-fetch stale DB businesses not returned by the Places search above, then sync them
        var staleMissingFromSearch = dbBusinesses
            .Where(b => IsStale(b) && !placesById.ContainsKey(b.GooglePlaceId))
            .Select(b => b.GooglePlaceId)
            .ToList();
        if (staleMissingFromSearch.Count > 0)
        {
            var fetched = await googlePlacesService.BulkFetchAsync(staleMissingFromSearch);
            foreach (var place in fetched.Places)
                placesById[place.Id] = place;
            if (fetched.NotFoundPlaceIds.Count > 0)
                await DeleteBusinessesAsync(fetched.NotFoundPlaceIds);
        }
        await SyncStaleAsync(dbBusinesses, placesById);

        // Step 4: Build responses for DB businesses (already sorted by policy from the query).
        //         Drop any that are still stale: their place ID is obsolete (now deleted) or the fetch failed.
        var dbResponses = dbBusinesses
            .Where(b => !IsStale(b))
            .Select(MapDbBusinessToResponse);

        // Step 5: Append placeholder responses for Google Places backfill
        var backfillResponses = backfillPlaces.Select(MapPlaceToResponse);

        return [.. dbResponses, .. backfillResponses];
    }

    private async Task<List<string>> FetchPhotoUrisAsync(Place place)
    {
        var uris = await Task.WhenAll(
            place.Photos.Take(MaxPhotos).Select(p => googlePlacesService.GetPhotoMediaUriAsync(p.Name)));
        return [.. uris.OfType<string>()];
    }

    private async Task DeleteBusinessesAsync(IReadOnlyCollection<string> googlePlaceIds)
    {
        try { await businessRepository.DeleteByGooglePlaceIdsAsync(googlePlaceIds); }
        catch (Exception ex) { logger.LogWarning(ex, "Failed to delete obsolete or closed businesses"); }
    }

    private static bool IsStale(Business business) =>
        business.LastSyncedAt < DateTimeOffset.UtcNow - SyncStalenessWindow;

    private async Task SyncStaleAsync(IEnumerable<Business> businesses, Dictionary<string, Place> placesById)
    {
        var anySynced = false;
        foreach (var business in businesses)
        {
            if (!IsStale(business) || !placesById.TryGetValue(business.GooglePlaceId, out var place))
                continue;

            business.Location = place.Location.ToPoint();
            business.LastSyncedAt = DateTimeOffset.UtcNow;
            anySynced = true;
        }

        if (!anySynced)
            return;

        // The synced values are already on the tracked entities, so the response is unaffected by a failed save.
        try { await businessRepository.SaveChangesAsync(); }
        catch (Exception ex) { logger.LogWarning(ex, "Failed to persist synced business locations"); }
    }

    private static BusinessPinResponse MapDbBusinessToResponse(Business business)
    {
        // TippingVotes is always non-empty: Business rows are only created inside the
        // SubmitReportAsync transaction, which atomically upserts a report in the same commit.
        var winner = business.TippingVotes
            .GroupBy(v => v.TippingPolicy)
            .Select(g => (Policy: g.Key, Count: g.Count()))
            .OrderByDescending(x => x.Count)
            .First();

        return new BusinessPinResponse
        {
            GooglePlaceId = business.GooglePlaceId,
            Latitude = (decimal)business.Location.Y,
            Longitude = (decimal)business.Location.X,
            WinningPolicy = winner.Policy,
            WinningPolicyVoteCount = winner.Count
        };
    }

    private static BusinessPinResponse MapPlaceToResponse(Place place) => new()
    {
        GooglePlaceId = place.Id,
        Latitude = (decimal)place.Location.Latitude,
        Longitude = (decimal)place.Location.Longitude
    };
}
