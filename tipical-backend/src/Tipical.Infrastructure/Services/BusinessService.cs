using Google.Maps.Places.V1;
using Tipical.Core.DTOs;
using Tipical.Core.Repositories;
using Tipical.Core.Models;
using Tipical.Core.Services;

namespace Tipical.Infrastructure.Services;

public class BusinessService(
    IBusinessRepository businessRepository,
    ITippingVoteRepository tippingVoteRepository,
    IGooglePlacesService googlePlacesService) : IBusinessService
{
    public async Task<List<BusinessResponse>> SearchBusinessesAsync(BusinessSearchRequest request)
    {
        // Search Google Places API — text search when query is provided, nearby search otherwise
        IEnumerable<Place> places;
        if (string.IsNullOrWhiteSpace(request.Query))
        {
            var nearbyResults = await googlePlacesService.SearchNearbyAsync(
                request.Latitude,
                request.Longitude,
                request.Radius);
            places = nearbyResults.Places;
        }
        else
        {
            var textResults = await googlePlacesService.SearchAsync(
                request.Query,
                request.Latitude,
                request.Longitude,
                request.Radius);
            places = textResults.Places;
        }

        // Extract all Google Place IDs
        var googlePlaceIds = places.Select(p => p.Id).ToList();

        // Single bulk lookup for all businesses
        var existingBusinesses = await businessRepository.GetByGooglePlaceIdsAsync(googlePlaceIds);

        var businessResponses = new List<BusinessResponse>();

        foreach (var place in places)
        {
            // Check if business exists in database (has votes)
            if (existingBusinesses.TryGetValue(place.Id, out var business))
            {
                // Business exists - merge Google Places data with vote data
                var businessResponse = await MapToBusinessResponseAsync(business, place);
                businessResponses.Add(businessResponse);
            }
            else
            {
                // Placeholder - business not voted on yet
                var placeholderResponse = new BusinessResponse
                {
                    Id = Guid.NewGuid(), // Temporary GUID (not persisted)
                    GooglePlaceId = place.Id,
                    Name = place.DisplayName.Text,
                    Address = place.FormattedAddress,
                    PlaceTypes = [.. place.Types_],
                    Phone = place.InternationalPhoneNumber,
                    Website = place.WebsiteUri,
                    WinningPolicy = null, // Indicates placeholder
                    WinningPolicyVoteCount = null
                };
                businessResponses.Add(placeholderResponse);
            }
        }

        // Sort by tipping policy ranking (NoTips first, then TipsExcludeTax, then TipsIncludeTax, then Unknown/placeholders)
        return [.. businessResponses.OrderBy(b => b.WinningPolicy.HasValue ? (int)b.WinningPolicy.Value : 999)];
    }

    private async Task<BusinessResponse> MapToBusinessResponseAsync(Business business, Place place)
    {
        var voteCounts = await tippingVoteRepository.GetVoteCountsByPolicyAsync(business.Id);

        TippingPolicy? winningPolicy = null;
        int? winningPolicyVoteCount = null;

        if (voteCounts.Count != 0)
        {
            var winner = voteCounts.OrderByDescending(kvp => kvp.Value).First();
            winningPolicy = winner.Key;
            winningPolicyVoteCount = winner.Value;
        }

        return new BusinessResponse
        {
            Id = business.Id,
            GooglePlaceId = business.GooglePlaceId,
            Name = place.DisplayName.Text,
            Address = place.FormattedAddress,
            PlaceTypes = [.. place.Types_],
            Phone = !string.IsNullOrWhiteSpace(place.InternationalPhoneNumber) ? place.InternationalPhoneNumber : null,
            Website = !string.IsNullOrWhiteSpace(place.WebsiteUri) ? place.WebsiteUri : null,
            WinningPolicy = winningPolicy,
            WinningPolicyVoteCount = winningPolicyVoteCount
        };
    }
}
