using Google.Maps.Places.V1;
using Google.Type;
using Microsoft.Extensions.Configuration;
using Tipical.Core.Services;

namespace Tipical.Infrastructure.Services;

public class GooglePlacesService : IGooglePlacesService
{
    private readonly PlacesClient _client;

    public GooglePlacesService(IConfiguration configuration)
    {
        _client = new PlacesClientBuilder
        {
            ApiKey = configuration["GooglePlaces:ApiKey"] ?? throw new InvalidOperationException("Google Places API key not configured")
        }.Build();
    }

    public async Task<SearchTextResponse> SearchAsync(string query, double? latitude = null, double? longitude = null, int radius = 5000)
    {
        var request = new SearchTextRequest
        {
            TextQuery = query,
            MaxResultCount = 20
        };

        // Add location bias if coordinates provided
        if (latitude.HasValue && longitude.HasValue)
        {
            request.LocationBias = new SearchTextRequest.Types.LocationBias
            {
                Circle = new Circle
                {
                    Center = new LatLng
                    {
                        Latitude = latitude.Value,
                        Longitude = longitude.Value
                    },
                    Radius = radius
                }
            };
        }

        return await _client.SearchTextAsync(request);
    }

    public async Task<AutocompletePlacesResponse> AutocompleteAsync(string input, double? latitude = null, double? longitude = null)
    {
        var request = new AutocompletePlacesRequest
        {
            Input = input
        };

        // Add location bias if coordinates provided
        if (latitude.HasValue && longitude.HasValue)
        {
            request.LocationBias = new AutocompletePlacesRequest.Types.LocationBias
            {
                Circle = new Circle
                {
                    Center = new LatLng
                    {
                        Latitude = latitude.Value,
                        Longitude = longitude.Value
                    },
                    Radius = 50000
                }
            };
        }

        return await _client.AutocompletePlacesAsync(request);
    }
}
