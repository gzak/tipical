using Tipical.Core.Models;

namespace Tipical.Core.DTOs;

/// <summary>Request body for submitting or updating a tipping policy vote.</summary>
public class TippingVoteRequest
{
    /// <summary>The tipping policy the user is voting for.</summary>
    public required TippingPolicy TippingPolicy { get; set; }

    /// <summary>Display name of the business being voted on.</summary>
    public required string Name { get; set; }

    /// <summary>Latitude of the business location.</summary>
    public required double Latitude { get; set; }

    /// <summary>Longitude of the business location.</summary>
    public required double Longitude { get; set; }
}

/// <summary>A single user's tipping policy vote for a business.</summary>
public class TippingVoteResponse
{
    /// <summary>Internal vote ID.</summary>
    public Guid Id { get; set; }

    /// <summary>Google Place ID of the business this vote is for.</summary>
    public string GooglePlaceId { get; set; } = null!;

    /// <summary>The tipping policy the user voted for.</summary>
    public TippingPolicy TippingPolicy { get; set; }

    /// <summary>When this vote was first cast.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>When this vote was last updated.</summary>
    public DateTime UpdatedAt { get; set; }
}

/// <summary>Aggregate tipping policy vote counts for a business.</summary>
public class TippingVotesAggregateResponse
{
    /// <summary>Google Place ID of the business.</summary>
    public string GooglePlaceId { get; set; } = null!;

    /// <summary>The tipping policy with the most votes, or null if no votes have been cast.</summary>
    public TippingPolicy? WinningPolicy { get; set; }

    /// <summary>Number of votes for the winning policy.</summary>
    public int? WinningPolicyVoteCount { get; set; }

    /// <summary>Vote count broken down by tipping policy.</summary>
    public Dictionary<TippingPolicy, int> VotesByPolicy { get; set; } = [];

    /// <summary>Total number of votes across all policies.</summary>
    public int TotalVotes { get; set; }
}
