using Google.Maps.Places.V1;
using Grpc.Core;
using Tipical.Core.DTOs;
using Tipical.Core.Repositories;
using Tipical.Core.Models;
using Tipical.Core.Services;

namespace Tipical.Infrastructure.Services;

public class BusinessService(
    IBusinessRepository businessRepository,
    IGooglePlacesService googlePlacesService) : IBusinessService
{
    private const int MaxResults = 20;
    private const int MaxPhotos = 5;

    public async Task<List<BusinessPinResponse>> PlaceDetailSearchAsync(string placeId, string sessionToken)
    {
        Place place;
        try { place = await googlePlacesService.GetPlaceAsync(placeId, sessionToken); }
        catch (RpcException) { return []; }

        var businessByPlaceId = await businessRepository.GetByGooglePlaceIdsAsync([placeId]);
        var response = businessByPlaceId.TryGetValue(placeId, out var business)
            ? MapDbBusinessToResponse(business, place)
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
        catch (RpcException) { return null; }

        var photos = await FetchPhotoUrisAsync(place);
        return new BusinessDetailResponse
        {
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

        // Step 3: Build responses in Places relevance order
        return [.. places.Select(p =>
            businessByPlaceId.TryGetValue(p.Id, out var business)
                ? MapDbBusinessToResponse(business, p)
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

        // Step 3: Bulk-fetch any DB businesses not returned by the Places search above
        var missingFromSearch = dbBusinesses
            .Where(b => !placesById.ContainsKey(b.GooglePlaceId))
            .Select(b => b.GooglePlaceId)
            .ToList();
        if (missingFromSearch.Count > 0)
        {
            var fetched = await googlePlacesService.BulkFetchAsync(missingFromSearch);
            foreach (var place in fetched)
                placesById[place.Id] = place;
        }

        // Step 4: Build responses for DB businesses (already sorted by policy from the query).
        //         Enrich with Google Places display data when available.
        var dbResponses = dbBusinesses
            .Where(b => placesById.ContainsKey(b.GooglePlaceId))
            .Select(b => MapDbBusinessToResponse(b, placesById[b.GooglePlaceId]));

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

    private static BusinessPinResponse ApplyPlaceFields(BusinessPinResponse response, Place place)
    {
        response.Name = place.DisplayName.Text;
        response.Latitude = (decimal)place.Location.Latitude;
        response.Longitude = (decimal)place.Location.Longitude;
        return response;
    }

    private static BusinessPinResponse MapDbBusinessToResponse(Business business, Place place)
    {
        // TippingVotes is always non-empty: Business rows are only created inside the
        // SubmitReportAsync transaction, which atomically upserts a report in the same commit.
        var winner = business.TippingVotes
            .GroupBy(v => v.TippingPolicy)
            .Select(g => (Policy: g.Key, Count: g.Count()))
            .OrderByDescending(x => x.Count)
            .First();

        return ApplyPlaceFields(new BusinessPinResponse
        {
            GooglePlaceId = business.GooglePlaceId,
            WinningPolicy = winner.Policy,
            WinningPolicyVoteCount = winner.Count
        }, place);
    }

    private static BusinessPinResponse MapPlaceToResponse(Place place) =>
        ApplyPlaceFields(new BusinessPinResponse { GooglePlaceId = place.Id }, place);
}
