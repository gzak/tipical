using Microsoft.AspNetCore.Mvc;
using Tipical.Core.DTOs;
using Tipical.Infrastructure.Services;

namespace Tipical.Api.Controllers;

[ApiController]
[Route("api/v1/businesses")]
public class BusinessesController : ControllerBase
{
    private readonly BusinessService _businessService;
    private readonly ILogger<BusinessesController> _logger;

    public BusinessesController(BusinessService businessService, ILogger<BusinessesController> logger)
    {
        _businessService = businessService;
        _logger = logger;
    }

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

        var results = await _businessService.SearchBusinessesAsync(request);
        return Ok(results);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(BusinessResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BusinessResponse>> GetById(Guid id)
    {
        var business = await _businessService.GetBusinessByIdAsync(id);

        if (business == null)
        {
            return NotFound(new { message = $"Business with ID {id} not found" });
        }

        return Ok(business);
    }

    [HttpGet("nearby")]
    [ProducesResponseType(typeof(List<BusinessResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BusinessResponse>>> GetNearby([FromQuery] double latitude, [FromQuery] double longitude, [FromQuery] int radius = 5000, [FromQuery] string? type = null)
    {
        var request = new NearbyBusinessesRequest
        {
            Latitude = latitude,
            Longitude = longitude,
            Radius = radius,
            Type = type
        };

        var results = await _businessService.GetNearbyBusinessesAsync(request);
        return Ok(results);
    }
}
