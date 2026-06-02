using Microsoft.AspNetCore.Mvc;
using Tipical.Core.DTOs;
using Tipical.Core.Services;

namespace Tipical.Api.Controllers;

[ApiController]
[Route("api/v1/businesses")]
public class BusinessesController(IBusinessService businessService, ILogger<BusinessesController> logger) : ControllerBase
{
    /// <summary>Search for businesses near a location, or look up a single place by ID.</summary>
    /// <param name="placeId">Google Place ID for a direct place lookup (from autocomplete selection).</param>
    /// <param name="sessionToken">Autocomplete session token to close the billing session when using placeId.</param>
    /// <param name="query">Optional name or keyword filter (used when placeId is absent).</param>
    /// <param name="latitude">Center latitude of the search area (used when placeId is absent).</param>
    /// <param name="longitude">Center longitude of the search area (used when placeId is absent).</param>
    /// <param name="radius">Search radius in meters (used when placeId is absent).</param>
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<BusinessResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BusinessResponse>>> Search(
        [FromQuery] string? placeId,
        [FromQuery] string? sessionToken,
        [FromQuery] string? query,
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] int radius)
    {
        if (!string.IsNullOrWhiteSpace(placeId))
        {
            if (string.IsNullOrWhiteSpace(sessionToken))
                return BadRequest("sessionToken is required when placeId is provided.");
            var result = await businessService.PlaceDetailSearchAsync(placeId, sessionToken);
            return Ok(result);
        }

        var request = new BusinessSearchRequest
        {
            Query = query,
            Latitude = latitude,
            Longitude = longitude,
            Radius = radius
        };

        var results = await businessService.SearchBusinessesAsync(request);
        return Ok(results);
    }
}
