using Tipical.Core.Models;
using Tipical.Core.Repositories;
using Tipical.Infrastructure.Data;

namespace Tipical.Infrastructure.Repositories;

public class SuggestionRepository(ApplicationDbContext context) : ISuggestionRepository
{
    public async Task AddAsync(Suggestion suggestion)
    {
        context.Suggestions.Add(suggestion);
        await context.SaveChangesAsync();
    }
}
