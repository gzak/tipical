using Google.Api.Gax.Grpc;
using Google.Maps.Places.V1;
using Google.Type;
using Microsoft.Extensions.Configuration;
using Tipical.Core.Services;

namespace Tipical.Infrastructure.Services;

public class GooglePlacesService : IGooglePlacesService
{
    private static readonly CallSettings GetPlaceSettings =
        FieldMask.For<Place>()
            .Include(p => new { p.Id, p.DisplayName, p.FormattedAddress, p.Types_, p.InternationalPhoneNumber, p.WebsiteUri, p.Location })
            .ToCallSettings();

    private static readonly CallSettings NearbySearchSettings =
        FieldMask.For<SearchNearbyResponse>()
            .Include(r => r.Places)
            .ThenInclude(p => new { p.Id, p.DisplayName, p.FormattedAddress, p.Types_, p.InternationalPhoneNumber, p.WebsiteUri, p.Location })
            .ToCallSettings();

    private static readonly CallSettings TextSearchSettings =
        FieldMask.For<SearchTextResponse>()
            .Include(r => r.Places)
            .ThenInclude(p => new { p.Id, p.DisplayName, p.FormattedAddress, p.Types_, p.InternationalPhoneNumber, p.WebsiteUri, p.Location })
            .ToCallSettings();

    private readonly PlacesClient _client;

    public GooglePlacesService(IConfiguration configuration)
    {
        _client = new PlacesClientBuilder
        {
            ApiKey = configuration["GooglePlaces:ApiKey"] ?? throw new InvalidOperationException("Google Places API key not configured")
        }.Build();
    }

    public async Task<SearchTextResponse> SearchAsync(string query, double latitude, double longitude, int radius, int maxResultCount = 20)
    {
        return await _client.SearchTextAsync(new SearchTextRequest
        {
            TextQuery = query,
            MaxResultCount = maxResultCount,
            LocationBias = new SearchTextRequest.Types.LocationBias
            {
                Circle = new Circle
                {
                    Center = new LatLng { Latitude = latitude, Longitude = longitude },
                    Radius = radius
                }
            }
        }, TextSearchSettings);
    }

    public async Task<SearchNearbyResponse> SearchNearbyAsync(double latitude, double longitude, int radius, int maxResultCount = 20)
    {
        return await _client.SearchNearbyAsync(new SearchNearbyRequest
        {
            MaxResultCount = maxResultCount,
            IncludedTypes = { "restaurant", "cafe", "coffee_shop", "bar" },
            LocationRestriction = new SearchNearbyRequest.Types.LocationRestriction
            {
                Circle = new Circle
                {
                    Center = new LatLng { Latitude = latitude, Longitude = longitude },
                    Radius = radius
                }
            }
        }, NearbySearchSettings);
    }

    public async Task<IReadOnlyList<Place>> BulkFetchAsync(IEnumerable<string> placeIds)
    {
        var tasks = placeIds.Select(async id =>
        {
            try { return await _client.GetPlaceAsync(new GetPlaceRequest { Name = $"places/{id}" }, GetPlaceSettings); }
            catch { return null; }
        });
        return (await Task.WhenAll(tasks)).Where(p => p != null).Select(p => p!).ToList();
    }

    public async Task<AutocompletePlacesResponse> AutocompleteAsync(string input, double latitude, double longitude, int radius)
    {
        return await _client.AutocompletePlacesAsync(new AutocompletePlacesRequest
        {
            Input = input,
            LocationBias = new AutocompletePlacesRequest.Types.LocationBias
            {
                Circle = new Circle
                {
                    Center = new LatLng { Latitude = latitude, Longitude = longitude },
                    Radius = radius
                }
            }
        });
    }
}
