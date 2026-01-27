using Tipical.Core.Models;

namespace Tipical.Core.Interfaces;

public interface IBusinessRepository
{
    Task<Business?> GetByIdAsync(Guid id);
    Task<Business?> GetByGooglePlaceIdAsync(string googlePlaceId);
    Task<IEnumerable<Business>> GetNearbyAsync(double latitude, double longitude, int radiusMeters);
    Task<Business> CreateAsync(Business business);
    Task<Business> UpdateAsync(Business business);
    Task<IEnumerable<Business>> SearchAsync(string query);
}
