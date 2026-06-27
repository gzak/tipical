using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Tipical.Core.DTOs;
using Tipical.Core.Services;

namespace Tipical.Api.Controllers;

[ApiController]
[Route("api/v1/suggestions")]
public class SuggestionsController(ISuggestionService suggestionService) : ControllerBase
{
    /// <summary>Submit an anonymous suggestion.</summary>
    [HttpPost]
    [EnableRateLimiting("suggestions")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Submit([FromBody] SuggestionRequest request)
    {
        await suggestionService.SubmitAsync(request.Body);
        return StatusCode(StatusCodes.Status201Created);
    }
}
