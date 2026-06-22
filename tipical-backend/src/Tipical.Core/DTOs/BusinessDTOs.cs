using Tipical.Core.Models;

namespace Tipical.Core.DTOs;

/// <summary>Query parameters for searching nearby businesses.</summary>
public class BusinessSearchRequest
{
    /// <summary>Optional name or keyword filter.</summary>
    public string? Query { get; set; }

    /// <summary>Center latitude of the search area.</summary>
    public required double Latitude { get; set; }

    /// <summary>Center longitude of the search area.</summary>
    public required double Longitude { get; set; }

    /// <summary>Search radius in meters.</summary>
    public required int Radius { get; set; }
}

/// <summary>Lean business data needed to render a map pin.</summary>
public class BusinessPinResponse
{
    /// <summary>Internal Tipical business ID.</summary>
    public Guid Id { get; set; }

    /// <summary>Google Place ID for this business.</summary>
    public required string GooglePlaceId { get; set; }

    /// <summary>Business display name.</summary>
    public string Name { get; set; } = null!;

    /// <summary>Latitude of the business location.</summary>
    public decimal Latitude { get; set; }

    /// <summary>Longitude of the business location.</summary>
    public decimal Longitude { get; set; }

    /// <summary>Google Places type tags for this business (e.g. "restaurant", "cafe").</summary>
    public List<string> PlaceTypes { get; set; } = [];

    /// <summary>The tipping policy with the most votes, if any votes have been cast.</summary>
    public TippingPolicy? WinningPolicy { get; set; }

    /// <summary>Number of votes for the winning policy.</summary>
    public int? WinningPolicyVoteCount { get; set; }
}

/// <summary>Rich business detail fetched lazily when a pin is opened.</summary>
public class BusinessDetailResponse
{
    /// <summary>Formatted street address.</summary>
    public string? Address { get; set; }

    /// <summary>Business phone number, if available.</summary>
    public string? Phone { get; set; }

    /// <summary>Business website URL, if available.</summary>
    public string? Website { get; set; }

    /// <summary>Google Places rating (1.0–5.0), if available.</summary>
    public double? Rating { get; set; }

    /// <summary>Total number of Google user ratings, if available.</summary>
    public int? ReviewCount { get; set; }

    /// <summary>Photo media URLs (up to 5), resolved server-side from Google Places.</summary>
    public List<string> Photos { get; set; } = [];
}
