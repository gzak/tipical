namespace Tipical.Core.Models;

public class Suggestion
{
    public Guid Id { get; set; }
    public string Body { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
}
