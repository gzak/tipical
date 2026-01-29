using Google.Maps.Places.V1;

namespace Tipical.Core.Services;

public interface IGooglePlacesService
{
    Task<SearchTextResponse> SearchAsync(string query, double? latitude = null, double? longitude = null, int radius = 5000);
    Task<AutocompletePlacesResponse> AutocompleteAsync(string input, double? latitude = null, double? longitude = null);
}
