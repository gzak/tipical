using Google.Maps.Places.V1;
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

    public async Task<List<BusinessResponse>> SearchBusinessesAsync(BusinessSearchRequest request)
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
            IEnumerable<Place> places;
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                var result = await googlePlacesService.SearchNearbyAsync(
                    request.Latitude, request.Longitude, request.Radius,
                    maxResultCount: MaxResults);
                places = result.Places;
            }
            else
            {
                var result = await googlePlacesService.SearchAsync(
                    request.Query, request.Latitude, request.Longitude, request.Radius,
                    maxResultCount: MaxResults);
                places = result.Places;
            }

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
            .Select(b => MapDbBusinessToResponse(b, placesById[b.GooglePlaceId]));

        // Step 5: Append placeholder responses for Google Places backfill
        var backfillResponses = backfillPlaces.Select(MapPlaceToResponse);

        return [.. dbResponses, .. backfillResponses];
    }

    private static BusinessResponse MapDbBusinessToResponse(Business business, Place place)
    {
        var winner = business.TippingVotes
            .GroupBy(v => v.TippingPolicy)
            .Select(g => (Policy: g.Key, Count: g.Count()))
            .OrderByDescending(x => x.Count)
            .First();

        return new BusinessResponse
        {
            Id = business.Id,
            GooglePlaceId = business.GooglePlaceId,
            Name = place.DisplayName.Text,
            Address = place.FormattedAddress,
            Latitude = (decimal)place.Location.Latitude,
            Longitude = (decimal)place.Location.Longitude,
            PlaceTypes = [.. place.Types_],
            Phone = !string.IsNullOrWhiteSpace(place.InternationalPhoneNumber) ? place.InternationalPhoneNumber : null,
            Website = !string.IsNullOrWhiteSpace(place.WebsiteUri) ? place.WebsiteUri : null,
            WinningPolicy = winner.Policy,
            WinningPolicyVoteCount = winner.Count
        };
    }

    private static BusinessResponse MapPlaceToResponse(Place place) =>
        new()
        {
            GooglePlaceId = place.Id,
            Name = place.DisplayName.Text,
            Address = place.FormattedAddress,
            Latitude = (decimal)place.Location.Latitude,
            Longitude = (decimal)place.Location.Longitude,
            PlaceTypes = [.. place.Types_],
            Phone = !string.IsNullOrWhiteSpace(place.InternationalPhoneNumber) ? place.InternationalPhoneNumber : null,
            Website = !string.IsNullOrWhiteSpace(place.WebsiteUri) ? place.WebsiteUri : null,
            WinningPolicy = null,
            WinningPolicyVoteCount = null
        };
}
