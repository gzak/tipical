using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace Tipical.Infrastructure.Services;

public class GooglePlacesService(HttpClient httpClient, IConfiguration configuration)
{
    private readonly string _apiKey = configuration["GooglePlaces:ApiKey"] ?? throw new InvalidOperationException("Google Places API key not configured");
    private const string BaseUrl = "https://maps.googleapis.com/maps/api/place";

    public async Task<GooglePlacesSearchResponse> SearchAsync(string query, double? latitude = null, double? longitude = null, int radius = 5000)
    {
        var url = $"{BaseUrl}/textsearch/json?query={Uri.EscapeDataString(query)}&key={_apiKey}";

        if (latitude.HasValue && longitude.HasValue)
        {
            url += $"&location={latitude},{longitude}&radius={radius}";
        }

        var response = await httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<GooglePlacesSearchResponse>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return result ?? new GooglePlacesSearchResponse { Results = [] };
    }

    public async Task<GooglePlacesAutocompleteResponse> AutocompleteAsync(string input, double? latitude = null, double? longitude = null)
    {
        var url = $"{BaseUrl}/autocomplete/json?input={Uri.EscapeDataString(input)}&key={_apiKey}";

        if (latitude.HasValue && longitude.HasValue)
        {
            url += $"&location={latitude},{longitude}&radius=50000";
        }

        var response = await httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<GooglePlacesAutocompleteResponse>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return result ?? new GooglePlacesAutocompleteResponse { Predictions = [] };
    }
}

// Response models
public class GooglePlacesSearchResponse
{
    public List<GooglePlace> Results { get; set; } = [];
    public string Status { get; set; } = string.Empty;
}

public class GooglePlace
{
    public string Place_Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Formatted_Address { get; set; } = string.Empty;
    public string? Formatted_Phone_Number { get; set; }
    public string? Website { get; set; }
    public GoogleGeometry? Geometry { get; set; }
    public List<string> Types { get; set; } = [];
}

public class GoogleGeometry
{
    public GoogleLocation? Location { get; set; }
}

public class GoogleLocation
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public class GooglePlacesAutocompleteResponse
{
    public List<GooglePrediction> Predictions { get; set; } = [];
    public string Status { get; set; } = string.Empty;
}

public class GooglePrediction
{
    public string Description { get; set; } = string.Empty;
    public string Place_Id { get; set; } = string.Empty;
}
