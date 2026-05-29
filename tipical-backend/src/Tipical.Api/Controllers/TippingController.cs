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
    /// <summary>Get the aggregate tipping policy votes for a business.</summary>
    /// <param name="googlePlaceId">The Google Place ID of the business.</param>
    [HttpGet("votes/{googlePlaceId}")]
    [ProducesResponseType(typeof(TippingVotesAggregateResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TippingVotesAggregateResponse>> GetVotes(string googlePlaceId)
    {
        var aggregate = await tippingService.GetVotesAggregateAsync(googlePlaceId);
        return Ok(aggregate);
    }

    /// <summary>Get the current user's tipping policy vote for a business.</summary>
    /// <param name="googlePlaceId">The Google Place ID of the business.</param>
    [HttpGet("votes/{googlePlaceId}/user")]
    [Authorize]
    [ProducesResponseType(typeof(TippingVoteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TippingVoteResponse>> GetUserVote(string googlePlaceId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        var vote = await tippingService.GetUserVoteAsync(googlePlaceId, userId);

        if (vote == null)
        {
            return NotFound(new { message = "User has not voted for this business" });
        }

        return Ok(vote);
    }

    /// <summary>Submit or update the current user's tipping policy vote for a business.</summary>
    /// <param name="googlePlaceId">The Google Place ID of the business.</param>
    /// <param name="request">The tipping policy vote to record.</param>
    [HttpPut("votes/{googlePlaceId}")]
    [Authorize]
    [ProducesResponseType(typeof(TippingVoteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TippingVoteResponse>> SubmitVote(string googlePlaceId, [FromBody] TippingVoteRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        var vote = await tippingService.SubmitVoteAsync(
            googlePlaceId, userId, request.TippingPolicy, request.Name, request.Latitude, request.Longitude);
        return Ok(vote);
    }
}
