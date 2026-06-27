using Tipical.Core.Models;
using Tipical.Core.Repositories;
using Tipical.Core.Services;

namespace Tipical.Infrastructure.Services;

public class SuggestionService(ISuggestionRepository suggestionRepository) : ISuggestionService
{
    public async Task SubmitAsync(string body)
    {
        var suggestion = new Suggestion { Body = body };
        await suggestionRepository.AddAsync(suggestion);
    }
}
