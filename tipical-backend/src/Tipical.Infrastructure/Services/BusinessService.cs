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

    public async Task<List<BusinessResponse>> PlaceDetailSearchAsync(string placeId, string sessionToken)
    {
        Place place;
        try { place = await googlePlacesService.GetPlaceAsync(placeId, sessionToken); }
        catch (RpcException) { return []; }

        var businessByPlaceId = await businessRepository.GetByGooglePlaceIdsAsync([placeId]);
        var photos = await FetchPhotoUrisAsync(place);
        var response = businessByPlaceId.TryGetValue(placeId, out var business)
            ? MapDbBusinessToResponse(business, place, photos)
            : MapPlaceToResponse(place, photos);
        return [response];
    }

    public Task<List<BusinessResponse>> SearchBusinessesAsync(BusinessSearchRequest request) =>
        string.IsNullOrWhiteSpace(request.Query)
            ? NearbySearchAsync(request)
            : TextSearchAsync(request);

    private async Task<List<BusinessResponse>> TextSearchAsync(BusinessSearchRequest request)
    {
        // Step 1: Places API text search is the authoritative source and ordering
        var placesResult = await googlePlacesService.SearchAsync(
            request.Query!, request.Latitude, request.Longitude, request.Radius,
            maxResultCount: MaxResults);
        var places = placesResult.Places;

        // Step 2: Correlate with DB to enrich matches with tipping policy data
        var businessByPlaceId = await businessRepository.GetByGooglePlaceIdsAsync(
            places.Select(p => p.Id));

        // Step 3: Build responses in Places relevance order
        return [.. await Task.WhenAll(places.Select(async p =>
        {
            var photos = await FetchPhotoUrisAsync(p);
            return businessByPlaceId.TryGetValue(p.Id, out var business)
                ? MapDbBusinessToResponse(business, p, photos)
                : MapPlaceToResponse(p, photos);
        }))];
    }

    private async Task<List<BusinessResponse>> NearbySearchAsync(BusinessSearchRequest request)
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
        var dbResponsesTask = Task.WhenAll(dbBusinesses
            .Where(b => placesById.ContainsKey(b.GooglePlaceId))
            .Select(async b =>
            {
                var place = placesById[b.GooglePlaceId];
                return MapDbBusinessToResponse(b, place, await FetchPhotoUrisAsync(place));
            }));

        // Step 5: Append placeholder responses for Google Places backfill — runs in parallel with step 4
        var backfillResponsesTask = Task.WhenAll(backfillPlaces
            .Select(async p => MapPlaceToResponse(p, await FetchPhotoUrisAsync(p))));

        return [.. await dbResponsesTask, .. await backfillResponsesTask];
    }

    private async Task<List<string>> FetchPhotoUrisAsync(Place place)
    {
        var uris = await Task.WhenAll(
            place.Photos.Take(MaxPhotos).Select(p => googlePlacesService.GetPhotoMediaUriAsync(p.Name)));
        return [.. uris.OfType<string>()];
    }

    private static BusinessResponse ApplyPlaceFields(BusinessResponse response, Place place, List<string> photos)
    {
        response.Name = place.DisplayName.Text;
        response.Address = place.FormattedAddress;
        response.Latitude = (decimal)place.Location.Latitude;
        response.Longitude = (decimal)place.Location.Longitude;
        response.PlaceTypes = [.. place.Types_];
        response.Phone = !string.IsNullOrWhiteSpace(place.InternationalPhoneNumber) ? place.InternationalPhoneNumber : null;
        response.Website = !string.IsNullOrWhiteSpace(place.WebsiteUri) ? place.WebsiteUri : null;
        response.Rating = place.HasUserRatingCount && place.UserRatingCount > 0 ? place.Rating : null;
        response.ReviewCount = place.HasUserRatingCount ? place.UserRatingCount : null;
        response.Photos = photos;
        return response;
    }

    private static BusinessResponse MapDbBusinessToResponse(Business business, Place place, List<string> photos)
    {
        // TippingVotes is always non-empty: Business rows are only created inside the
        // SubmitVoteAsync transaction, which atomically upserts a vote in the same commit.
        var winner = business.TippingVotes
            .GroupBy(v => v.TippingPolicy)
            .Select(g => (Policy: g.Key, Count: g.Count()))
            .OrderByDescending(x => x.Count)
            .First();

        return ApplyPlaceFields(new BusinessResponse
        {
            Id = business.Id,
            GooglePlaceId = business.GooglePlaceId,
            WinningPolicy = winner.Policy,
            WinningPolicyVoteCount = winner.Count
        }, place, photos);
    }

    private static BusinessResponse MapPlaceToResponse(Place place, List<string> photos) =>
        ApplyPlaceFields(new BusinessResponse { GooglePlaceId = place.Id }, place, photos);
}
