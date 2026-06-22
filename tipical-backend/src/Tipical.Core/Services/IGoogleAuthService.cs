using Tipical.Core.DTOs;

namespace Tipical.Core.Services;

public interface IGoogleAuthService
{
    Task<AuthResponse> VerifyGoogleTokenAsync(string idToken);
}
