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
    [HttpGet("votes/{businessId}")]
    [ProducesResponseType(typeof(TippingVotesAggregateResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TippingVotesAggregateResponse>> GetVotes(Guid businessId)
    {
        var aggregate = await tippingService.GetVotesAggregateAsync(businessId);
        return Ok(aggregate);
    }

    [HttpGet("votes/{businessId}/user")]
    [Authorize]
    [ProducesResponseType(typeof(TippingVoteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TippingVoteResponse>> GetUserVote(Guid businessId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        var vote = await tippingService.GetUserVoteAsync(businessId, userId);

        if (vote == null)
        {
            return NotFound(new { message = "User has not voted for this business" });
        }

        return Ok(vote);
    }

    [HttpPut("votes/{businessId}")]
    [Authorize]
    [ProducesResponseType(typeof(TippingVoteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TippingVoteResponse>> SubmitVote(Guid businessId, [FromBody] TippingVoteRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new { message = "User ID not found in token" });
        }

        if (string.IsNullOrEmpty(request.GooglePlaceId))
        {
            return BadRequest(new { message = "GooglePlaceId is required" });
        }

        var vote = await tippingService.SubmitVoteAsync(businessId, userId, request.TippingPolicy, request.GooglePlaceId);
        return Ok(vote);
    }
}
