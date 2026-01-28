using Microsoft.AspNetCore.Mvc;
using Tipical.Core.DTOs;
using Tipical.Infrastructure.Services;

namespace Tipical.Api.Controllers;

[ApiController]
[Route("api/v1/businesses")]
public class BusinessesController(BusinessService businessService, ILogger<BusinessesController> logger) : ControllerBase
{
    [HttpGet("search")]
    [ProducesResponseType(typeof(List<BusinessResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BusinessResponse>>> Search([FromQuery] string query, [FromQuery] double? latitude, [FromQuery] double? longitude, [FromQuery] int radius = 5000)
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
