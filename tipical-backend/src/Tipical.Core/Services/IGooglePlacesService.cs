using Google.Maps.Places.V1;

namespace Tipical.Core.Services;

public interface IGooglePlacesService
{
    Task<SearchTextResponse> SearchAsync(string query, double latitude, double longitude, int radius);
    Task<AutocompletePlacesResponse> AutocompleteAsync(string input, double latitude, double longitude, int radius);
}
