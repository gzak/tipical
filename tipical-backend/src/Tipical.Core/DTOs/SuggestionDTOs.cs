using System.ComponentModel.DataAnnotations;

namespace Tipical.Core.DTOs;

public class SuggestionRequest
{
    [Required]
    [MaxLength(2000)]
    [RegularExpression(@".*\S.*", ErrorMessage = "Body must contain at least one non-whitespace character.")]
    public string Body { get; set; } = null!;
}
