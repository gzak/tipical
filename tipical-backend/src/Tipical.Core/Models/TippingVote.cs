namespace Tipical.Core.Models;

public class TippingVote
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string UserId { get; set; } = null!; // Google user ID
    public TippingPolicy TippingPolicy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Business Business { get; set; } = null!;
}
