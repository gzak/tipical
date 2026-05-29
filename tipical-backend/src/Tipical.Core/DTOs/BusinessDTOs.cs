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

/// <summary>Business details with crowd-sourced tipping policy summary.</summary>
public class BusinessResponse
{
    /// <summary>Internal Tipical business ID.</summary>
    public Guid Id { get; set; }

    /// <summary>Google Place ID for this business.</summary>
    public required string GooglePlaceId { get; set; }

    /// <summary>Business display name.</summary>
    public required string Name { get; set; }

    /// <summary>Formatted street address.</summary>
    public required string Address { get; set; }

    /// <summary>Latitude of the business location.</summary>
    public decimal Latitude { get; set; }

    /// <summary>Longitude of the business location.</summary>
    public decimal Longitude { get; set; }

    /// <summary>Google Places type tags for this business (e.g. "restaurant", "cafe").</summary>
    public required List<string> PlaceTypes { get; set; }

    /// <summary>Business phone number, if available.</summary>
    public string? Phone { get; set; }

    /// <summary>Business website URL, if available.</summary>
    public string? Website { get; set; }

    /// <summary>The tipping policy with the most votes, if any votes have been cast.</summary>
    public TippingPolicy? WinningPolicy { get; set; }

    /// <summary>Number of votes for the winning policy.</summary>
    public int? WinningPolicyVoteCount { get; set; }
}
