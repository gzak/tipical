using Tipical.Core.DTOs;

namespace Tipical.Core.Services;

public interface IBusinessService
{
    Task<List<BusinessPinResponse>> SearchBusinessesAsync(BusinessSearchRequest request);
    Task<List<BusinessPinResponse>> PlaceDetailSearchAsync(string placeId, string sessionToken);
    Task<BusinessDetailResponse?> GetBusinessDetailAsync(string googlePlaceId);
}
