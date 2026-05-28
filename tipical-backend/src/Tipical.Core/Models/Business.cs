using NetTopologySuite.Geometries;

namespace Tipical.Core.Models;

public class Business
{
    public Guid Id { get; set; }
    public string GooglePlaceId { get; set; } = null!;
    public string Name { get; set; } = null!;
    public Point Location { get; set; } = null!;

    // Navigation properties
    public ICollection<TippingVote> TippingVotes { get; set; } = [];
}
