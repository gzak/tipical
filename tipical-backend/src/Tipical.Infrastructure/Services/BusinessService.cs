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

        var businessResponses = new List<BusinessResponse>();

        foreach (var place in googleResults.Results)
        {
            // Check if business exists in our database
            var business = await businessRepository.GetByGooglePlaceIdAsync(place.Place_Id);

            if (business == null && place.Geometry?.Location != null)
            {
                // Create new business entry
                business = new Business
                {
                    Id = Guid.NewGuid(),
                    GooglePlaceId = place.Place_Id,
                    Name = place.Name,
                    Address = place.Formatted_Address,
                    Latitude = (decimal)place.Geometry.Location.Lat,
                    Longitude = (decimal)place.Geometry.Location.Lng,
                    PlaceTypes = [.. place.Types]
                };

                business = await businessRepository.CreateAsync(business);
            }

            if (business != null)
            {
                var businessResponse = await MapToBusinessResponseAsync(business);
                businessResponses.Add(businessResponse);
            }
        }

        // Sort by tipping policy ranking (NoTips first, then TipsExcludeTax, then TipsIncludeTax, then Unknown)
        return [.. businessResponses.OrderBy(b => b.WinningPolicy.HasValue ? (int)b.WinningPolicy.Value : 999)];
    }

    public async Task<BusinessResponse?> GetBusinessByIdAsync(Guid id)
    {
        var business = await businessRepository.GetByIdAsync(id);
        if (business == null) return null;

        return await MapToBusinessResponseAsync(business);
    }

    public async Task<List<BusinessResponse>> GetNearbyBusinessesAsync(NearbyBusinessesRequest request)
    {
        var businesses = await businessRepository.GetNearbyAsync(
            request.Latitude,
            request.Longitude,
            request.Radius);

        var businessResponses = new List<BusinessResponse>();
        foreach (var business in businesses)
        {
            var response = await MapToBusinessResponseAsync(business);
            businessResponses.Add(response);
        }

        // Sort by tipping policy ranking
        return [.. businessResponses.OrderBy(b => b.WinningPolicy.HasValue ? (int)b.WinningPolicy.Value : 999)];
    }

    private async Task<BusinessResponse> MapToBusinessResponseAsync(Business business)
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
            Name = business.Name,
            Address = business.Address,
            Latitude = business.Latitude,
            Longitude = business.Longitude,
            PlaceTypes = business.PlaceTypes,
            Phone = business.Phone,
            Website = business.Website,
            WinningPolicy = winningPolicy,
            WinningPolicyVoteCount = winningPolicyVoteCount
        };
    }
}
