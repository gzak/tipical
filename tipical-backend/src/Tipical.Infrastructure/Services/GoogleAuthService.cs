using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Tipical.Core.DTOs;

namespace Tipical.Infrastructure.Services;

public class GoogleAuthService
{
    private readonly IConfiguration _configuration;
    private readonly string _googleClientId;
    private readonly string _jwtSecret;
    private readonly string _jwtIssuer;
    private readonly string _jwtAudience;
    private readonly int _jwtExpirationHours;

    public GoogleAuthService(IConfiguration configuration)
    {
        _configuration = configuration;
        _googleClientId = configuration["GoogleOAuth:ClientId"] ?? throw new InvalidOperationException("Google OAuth Client ID not configured");
        _jwtSecret = configuration["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
        _jwtIssuer = configuration["JwtSettings:Issuer"] ?? "TipicalApi";
        _jwtAudience = configuration["JwtSettings:Audience"] ?? "TipicalApp";
        _jwtExpirationHours = int.Parse(configuration["JwtSettings:ExpirationHours"]!);
    }

    public async Task<AuthResponse> VerifyGoogleTokenAsync(string idToken)
    {
        try
        {
            // Verify the Google ID token
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_googleClientId]
            });

            // Generate our application JWT token
            var jwtToken = GenerateJwtToken(payload.Subject, payload.Email, payload.Name, payload.Picture);

            return new AuthResponse
            {
                Token = jwtToken,
                UserId = payload.Subject,
                Email = payload.Email,
                Name = payload.Name,
                Picture = payload.Picture
            };
        }
        catch (InvalidJwtException ex)
        {
            throw new UnauthorizedAccessException("Invalid Google token", ex);
        }
    }

    private string GenerateJwtToken(string userId, string email, string name, string? picture)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Name, name),
            new Claim(JwtRegisteredClaimNames.Picture, picture ?? ""),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _jwtIssuer,
            audience: _jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_jwtExpirationHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public UserInfoResponse GetUserInfoFromClaims(ClaimsPrincipal user)
    {
        return new UserInfoResponse
        {
            UserId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? "",
            Email = user.FindFirst(ClaimTypes.Email)?.Value ?? user.FindFirst(JwtRegisteredClaimNames.Email)?.Value ?? "",
            Name = user.FindFirst(ClaimTypes.Name)?.Value ?? user.FindFirst(JwtRegisteredClaimNames.Name)?.Value ?? "",
            Picture = user.FindFirst("picture")?.Value
        };
    }
}
