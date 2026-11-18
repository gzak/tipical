using NetTopologySuite.Geometries;

namespace Tipical.Core.Models;

public class Business
{
    public Guid Id { get; set; }
    public string GooglePlaceId { get; set; } = null!;
    public Point Location { get; set; } = null!;
    public DateTimeOffset LastSyncedAt { get; set; }

    // Navigation properties
    public ICollection<TippingVote> TippingVotes { get; set; } = [];
}
