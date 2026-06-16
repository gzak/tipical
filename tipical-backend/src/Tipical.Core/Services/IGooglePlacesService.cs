using Google.Maps.Places.V1;

namespace Tipical.Core.Services;

public interface IGooglePlacesService
{
    Task<SearchTextResponse> SearchAsync(string query, double latitude, double longitude, int radius, int maxResultCount = 20);
    Task<SearchNearbyResponse> SearchNearbyAsync(double latitude, double longitude, int radius, int maxResultCount = 20);
    Task<AutocompletePlacesResponse> AutocompleteAsync(string input, double latitude, double longitude, int radius);
    Task<Place> GetPlaceAsync(string placeId, string sessionToken);
    Task<IReadOnlyList<Place>> BulkFetchAsync(IEnumerable<string> placeIds);
    Task<string?> GetPhotoMediaUriAsync(string photoName, int maxWidthPx = 400);
}
