using Tipical.Core.Models;

namespace Tipical.Core.DTOs;

public class BusinessSearchRequest
{
    public string Query { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int Radius { get; set; } = 5000; // meters
}

public class BusinessResponse
{
    public Guid Id { get; set; }
    public string? GooglePlaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string[]? PlaceTypes { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public TippingPolicy? WinningPolicy { get; set; }
    public int? WinningPolicyVoteCount { get; set; }
}
