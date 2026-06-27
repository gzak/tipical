using Tipical.Core.Models;

namespace Tipical.Core.Repositories;

public interface ISuggestionRepository
{
    Task AddAsync(Suggestion suggestion);
}
