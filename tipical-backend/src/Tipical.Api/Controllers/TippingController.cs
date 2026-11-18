using Grpc.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Tipical.Core.DTOs;
using Tipical.Core.Services;

namespace Tipical.Api.Controllers;

[ApiController]
[Route("api/v1/tipping")]
public class TippingController(ITippingService tippingService, ILogger<TippingController> logger) : ControllerBase
{
    /// <summary>Get the aggregate tip suggestion reports for a business (path uses "votes" for compatibility).</summary>
    /// <param name="googlePlaceId">The Google Place ID of the business.</param>
    [HttpGet("votes/{googlePlaceId}")]
    [ProducesResponseType(typeof(TippingVotesAggregateResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TippingVotesAggregateResponse>> GetReports(string googlePlaceId)
    {
        var aggregate = await tippingService.GetReportsAggregateAsync(googlePlaceId);
        return Ok(aggregate);
    }

    /// <summary>Get the current user's tip suggestion report for a business (path uses "votes" for compatibility).</summary>
    /// <param name="googlePlaceId">The Google Place ID of the business.</param>
    [HttpGet("votes/{googlePlaceId}/user")]
    [Authorize]
    [ProducesResponseType(typeof(TippingVoteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TippingVoteResponse>> GetUserReport(string googlePlaceId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        var report = await tippingService.GetUserReportAsync(googlePlaceId, userId);

        if (report == null)
        {
            return NotFound(new { message = "User has not reported about this business" });
        }

        return Ok(report);
    }

    /// <summary>Submit or update the current user's tip suggestion report for a business (path uses "votes" for compatibility).</summary>
    /// <param name="googlePlaceId">The Google Place ID of the business.</param>
    /// <param name="request">The tip suggestion to report.</param>
    [HttpPut("votes/{googlePlaceId}")]
    [Authorize]
    [ProducesResponseType(typeof(TippingVoteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<TippingVoteResponse>> SubmitReport(string googlePlaceId, [FromBody] TippingVoteRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        TippingVoteResponse? report;
        try { report = await tippingService.SubmitReportAsync(googlePlaceId, userId, request.TippingPolicy); }
        catch (RpcException ex)
        {
            logger.LogError(ex, "Places lookup failed for {GooglePlaceId}", googlePlaceId);
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Could not look up this business" });
        }

        if (report == null)
        {
            return NotFound(new { message = "Business not found" });
        }

        return Ok(report);
    }
}
