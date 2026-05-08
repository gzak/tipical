using Tipical.Core.Models;

namespace Tipical.Core.DTOs;

public class TippingVoteRequest
{
    public required TippingPolicy TippingPolicy { get; set; }
    public required string Name { get; set; }
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
}

public class TippingVoteResponse
{
    public Guid Id { get; set; }
    public string GooglePlaceId { get; set; } = null!;
    public TippingPolicy TippingPolicy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class TippingVotesAggregateResponse
{
    public string GooglePlaceId { get; set; } = null!;
    public TippingPolicy? WinningPolicy { get; set; }
    public int? WinningPolicyVoteCount { get; set; }
    public Dictionary<TippingPolicy, int> VotesByPolicy { get; set; } = [];
    public int TotalVotes { get; set; }
}
