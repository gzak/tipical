using NetTopologySuite.Geometries;

namespace Tipical.Core.Models;

public class Business
{
    public Guid Id { get; set; }
    public string? GooglePlaceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public Point? Location { get; set; } // PostGIS geography point
    public string[]? PlaceTypes { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<TippingVote> TippingVotes { get; set; } = new List<TippingVote>();
}
