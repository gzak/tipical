using Tipical.Core.Models;

namespace Tipical.Core.DTOs;

public class BusinessSearchRequest
{
    public string? Query { get; set; }
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    public required int Radius { get; set; }
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
