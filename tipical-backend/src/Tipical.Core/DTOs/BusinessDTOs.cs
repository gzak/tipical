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
    public required string GooglePlaceId { get; set; }
    public required string Name { get; set; }
    public required string Address { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public required List<string> PlaceTypes { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public TippingPolicy? WinningPolicy { get; set; }
    public int? WinningPolicyVoteCount { get; set; }
}
