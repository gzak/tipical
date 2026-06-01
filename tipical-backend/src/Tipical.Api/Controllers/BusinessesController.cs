using Microsoft.AspNetCore.Mvc;
using Tipical.Core.DTOs;
using Tipical.Core.Services;

namespace Tipical.Api.Controllers;

[ApiController]
[Route("api/v1/businesses")]
public class BusinessesController(IBusinessService businessService, ILogger<BusinessesController> logger) : ControllerBase
{
    /// <summary>Search for businesses near a location.</summary>
    /// <param name="query">Optional name or keyword filter.</param>
    /// <param name="latitude">Center latitude of the search area.</param>
    /// <param name="longitude">Center longitude of the search area.</param>
    /// <param name="radius">Search radius in meters.</param>
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<BusinessResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BusinessResponse>>> Search([FromQuery] string? query, [FromQuery] double latitude, [FromQuery] double longitude, [FromQuery] int radius)
    {
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
