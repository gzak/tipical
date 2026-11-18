using Google.Api.Gax.Grpc;
using Google.Maps.Places.V1;
using Google.Type;
using Grpc.Core;
using Microsoft.Extensions.Configuration;
using Tipical.Core.Services;

namespace Tipical.Infrastructure.Services;

public class GooglePlacesService : IGooglePlacesService
{
    // DisplayName is unused; it keeps this session-ending call in the Pro tier so the autocomplete session stays free.
    private static readonly CallSettings GetPlaceSettings =
        FieldMask.For<Place>()
            .Include(p => new { p.Id, p.DisplayName, p.Location })
            .ToCallSettings();

    private static readonly CallSettings LocationOnlySettings =
        FieldMask.For<Place>()
            .Include(p => new { p.Id, p.Location })
            .ToCallSettings();

    private static readonly CallSettings NearbySearchSettings =
        FieldMask.For<SearchNearbyResponse>()
            .Include(r => r.Places)
            .ThenInclude(p => new { p.Id, p.Location })
            .ToCallSettings();

    private static readonly CallSettings TextSearchSettings =
        FieldMask.For<SearchTextResponse>()
            .Include(r => r.Places)
            .ThenInclude(p => new { p.Id, p.Location })
            .ToCallSettings();

    private static readonly CallSettings DetailPlaceSettings =
        FieldMask.For<Place>()
            .Include(p => new { p.DisplayName, p.BusinessStatus, p.Rating, p.UserRatingCount })
            .Include(p => p.Photos)
            .ThenInclude(photo => photo.Name)
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

    public async Task<Place> GetPlaceAsync(string placeId, string sessionToken)
    {
        return await _client.GetPlaceAsync(
            new GetPlaceRequest { Name = $"places/{placeId}", SessionToken = sessionToken },
            GetPlaceSettings);
    }

    public async Task<Place> GetPlaceDetailsAsync(string placeId)
    {
        return await _client.GetPlaceAsync(
            new GetPlaceRequest { Name = $"places/{placeId}" },
            DetailPlaceSettings);
    }

    public async Task<Place> GetPlaceLocationAsync(string placeId)
    {
        return await _client.GetPlaceAsync(
            new GetPlaceRequest { Name = $"places/{placeId}" },
            LocationOnlySettings);
    }

    public async Task<BulkFetchResult> BulkFetchAsync(IEnumerable<string> placeIds)
    {
        var results = await Task.WhenAll(placeIds.Select(async id =>
        {
            try { return (Id: id, Place: (Place?)await GetPlaceLocationAsync(id), NotFound: false); }
            catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound) { return (Id: id, Place: null, NotFound: true); }
            catch { return (Id: id, Place: null, NotFound: false); }
        }));
        return new BulkFetchResult(
            [.. results.Select(r => r.Place).OfType<Place>()],
            [.. results.Where(r => r.NotFound).Select(r => r.Id)]);
    }

    public async Task<string?> GetPhotoMediaUriAsync(string photoName, int maxWidthPx = 400)
    {
        try
        {
            var media = await _client.GetPhotoMediaAsync(new GetPhotoMediaRequest
            {
                Name = $"{photoName}/media",
                MaxWidthPx = maxWidthPx,
                SkipHttpRedirect = true
            });
            return string.IsNullOrWhiteSpace(media.PhotoUri) ? null : media.PhotoUri;
        }
        catch { return null; }
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
