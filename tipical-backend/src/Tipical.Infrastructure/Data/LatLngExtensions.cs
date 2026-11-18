using Google.Type;
using NetTopologySuite.Geometries;

namespace Tipical.Infrastructure.Data;

internal static class LatLngExtensions
{
    internal static Point ToPoint(this LatLng latLng) =>
        new(latLng.Longitude, latLng.Latitude) { SRID = GeoConstants.Wgs84Srid };
}
