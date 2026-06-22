namespace Tipical.Core.DTOs;

/// <summary>Request body for Google OAuth authentication.</summary>
public class GoogleAuthRequest
{
    /// <summary>Google ID token obtained from the Google Sign-In client library.</summary>
    public string IdToken { get; set; } = string.Empty;
}

/// <summary>Successful authentication response containing a Tipical JWT and user profile.</summary>
public class AuthResponse
{
    /// <summary>Tipical JWT access token to include in subsequent requests as a Bearer token.</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>Unique identifier for the authenticated user.</summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>Authenticated user's email address.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Authenticated user's display name.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>URL of the authenticated user's profile picture, if available.</summary>
    public string? Picture { get; set; }
}
