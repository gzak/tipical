using Tipical.Core.Models;

namespace Tipical.Core.DTOs;

/// <summary>Request body for submitting or updating a tip suggestion report.</summary>
public class TippingVoteRequest
{
    /// <summary>The tip suggestion the user is reporting.</summary>
    public required TippingPolicy TippingPolicy { get; set; }

    /// <summary>Display name of the business being reported on.</summary>
    public required string Name { get; set; }

    /// <summary>Latitude of the business location.</summary>
    public required double Latitude { get; set; }

    /// <summary>Longitude of the business location.</summary>
    public required double Longitude { get; set; }
}

/// <summary>A single user's tip suggestion report for a business.</summary>
public class TippingVoteResponse
{
    /// <summary>Internal report ID.</summary>
    public Guid Id { get; set; }

    /// <summary>Google Place ID of the business this report is for.</summary>
    public string GooglePlaceId { get; set; } = null!;

    /// <summary>The tip suggestion the user reported.</summary>
    public TippingPolicy TippingPolicy { get; set; }

    /// <summary>When this report was first submitted.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>When this report was last updated.</summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Aggregate tip suggestion report counts for a business.</summary>
public class TippingVotesAggregateResponse
{
    /// <summary>Google Place ID of the business.</summary>
    public string GooglePlaceId { get; set; } = null!;

    /// <summary>The tip suggestion with the most reports, or null if none.</summary>
    public TippingPolicy? WinningPolicy { get; set; }

    /// <summary>Number of reports for the winning suggestion.</summary>
    public int? WinningPolicyVoteCount { get; set; }

    /// <summary>Report count broken down by tip suggestion.</summary>
    public Dictionary<TippingPolicy, int> VotesByPolicy { get; set; } = [];

    /// <summary>Total number of reports across all suggestions.</summary>
    public int TotalVotes { get; set; }
}
