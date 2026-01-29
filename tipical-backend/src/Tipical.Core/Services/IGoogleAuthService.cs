using System.Security.Claims;
using Tipical.Core.DTOs;

namespace Tipical.Core.Services;

public interface IGoogleAuthService
{
    Task<AuthResponse> VerifyGoogleTokenAsync(string idToken);
    UserInfoResponse GetUserInfoFromClaims(ClaimsPrincipal user);
}
