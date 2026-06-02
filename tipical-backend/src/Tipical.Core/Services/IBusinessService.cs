using Tipical.Core.DTOs;

namespace Tipical.Core.Services;

public interface IBusinessService
{
    Task<List<BusinessResponse>> SearchBusinessesAsync(BusinessSearchRequest request);
    Task<List<BusinessResponse>> PlaceDetailSearchAsync(string placeId, string sessionToken);
}
