using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tipical.Core.DTOs;
using Tipical.Infrastructure.Services;

namespace Tipical.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(GoogleAuthService googleAuthService, ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("google")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> GoogleAuth([FromBody] GoogleAuthRequest request)
    {
        try
        {
            var response = await googleAuthService.VerifyGoogleTokenAsync(request.IdToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            logger.LogWarning(ex, "Failed Google authentication attempt");
            return Unauthorized(new { message = "Invalid Google token" });
        }
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserInfoResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<UserInfoResponse> GetCurrentUser()
    {
        var userInfo = googleAuthService.GetUserInfoFromClaims(User);
        return Ok(userInfo);
    }
}
