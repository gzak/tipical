using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Tipical.Core.DTOs;
using Tipical.Core.Services;

namespace Tipical.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(
    IGoogleAuthService googleAuthService,
    IOptions<AllowedUsersOptions> allowedUsers,
    ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("google")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AuthResponse>> GoogleAuth([FromBody] GoogleAuthRequest request)
    {
        try
        {
            var response = await googleAuthService.VerifyGoogleTokenAsync(request.IdToken);

            var options = allowedUsers.Value;
            var emailList = options.Emails.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (options.Enabled && !emailList.Contains(response.Email, StringComparer.OrdinalIgnoreCase))
            {
                logger.LogWarning("Blocked sign-in attempt from non-allowlisted email: {Email}", response.Email);
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Access restricted" });
            }

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
