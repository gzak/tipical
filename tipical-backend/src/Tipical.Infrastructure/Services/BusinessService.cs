using Tipical.Core.DTOs;
using Tipical.Core.Interfaces;
using Tipical.Core.Models;

namespace Tipical.Infrastructure.Services;

public class BusinessService(
    IBusinessRepository businessRepository,
    ITippingVoteRepository tippingVoteRepository,
    GooglePlacesService googlePlacesService)
{
    public async Task<List<BusinessResponse>> SearchBusinessesAsync(BusinessSearchRequest request)
    {
        // Search Google Places API
        var googleResults = await googlePlacesService.SearchAsync(
            request.Query,
            request.Latitude,
            request.Longitude,
            request.Radius);

        // Extract all Google Place IDs
        var googlePlaceIds = googleResults.Results.Select(p => p.Place_Id).ToList();

        // Single bulk lookup for all businesses
        var existingBusinesses = await businessRepository.GetByGooglePlaceIdsAsync(googlePlaceIds);

        var businessResponses = new List<BusinessResponse>();

        foreach (var place in googleResults.Results)
        {
            if (place.Geometry?.Location == null) continue;

            // Check if business exists in database (has votes)
            if (existingBusinesses.TryGetValue(place.Place_Id, out var business))
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
                    GooglePlaceId = place.Place_Id,
                    Name = place.Name,
                    Address = place.Formatted_Address,
                    Latitude = (decimal)place.Geometry.Location.Lat,
                    Longitude = (decimal)place.Geometry.Location.Lng,
                    PlaceTypes = [.. place.Types],
                    Phone = place.Formatted_Phone_Number,
                    Website = place.Website,
                    WinningPolicy = null, // Indicates placeholder
                    WinningPolicyVoteCount = null
                };
                businessResponses.Add(placeholderResponse);
            }
        }

        // Sort by tipping policy ranking (NoTips first, then TipsExcludeTax, then TipsIncludeTax, then Unknown/placeholders)
        return [.. businessResponses.OrderBy(b => b.WinningPolicy.HasValue ? (int)b.WinningPolicy.Value : 999)];
    }

    private async Task<BusinessResponse> MapToBusinessResponseAsync(Business business, GooglePlace googlePlace)
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
            Name = googlePlace.Name,
            Address = googlePlace.Formatted_Address,
            Latitude = googlePlace.Geometry?.Location != null ? (decimal)googlePlace.Geometry.Location.Lat : 0,
            Longitude = googlePlace.Geometry?.Location != null ? (decimal)googlePlace.Geometry.Location.Lng : 0,
            PlaceTypes = [.. googlePlace.Types],
            Phone = googlePlace.Formatted_Phone_Number,
            Website = googlePlace.Website,
            WinningPolicy = winningPolicy,
            WinningPolicyVoteCount = winningPolicyVoteCount
        };
    }
}
