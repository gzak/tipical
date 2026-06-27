namespace Tipical.Core.Services;

public interface ISuggestionService
{
    Task SubmitAsync(string body);
}
