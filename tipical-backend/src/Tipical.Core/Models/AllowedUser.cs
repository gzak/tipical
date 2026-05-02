namespace Tipical.Core.Models;

public class AllowedUser
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
}
