using Tipical.Core.Models;

namespace Tipical.Core.Repositories;

public interface IBusinessRepository
{
    Task<Business?> GetByIdAsync(Guid id);
    Task<Business?> GetByGooglePlaceIdAsync(string googlePlaceId);
    Task<Dictionary<string, Business>> GetByGooglePlaceIdsAsync(IEnumerable<string> googlePlaceIds);
    Task<Business> CreateAsync(Business business);
}
