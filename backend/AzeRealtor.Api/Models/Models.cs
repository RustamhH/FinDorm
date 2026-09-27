namespace AzeRealtor.Api.Models;

public record Listing(int Id, decimal Price, string Location, int Rooms, double Square, string Floor, bool NewBuilding, bool HasRoommate, double Lat, double Lng);

public record University(int Id, string Name, double Lat, double Lng);

public enum LivingMode { Any, Solo, Mate }

public enum SortBy { Distance, PriceDesc, PriceAsc }

public record SearchRequest(int UniversityId, decimal Budget, int Rooms = 0, LivingMode Mode = LivingMode.Any, int Skip = 0, int Take = 15, SortBy Sort = SortBy.Distance);

public record HouseResult(
    int Id, string Location, decimal Price, int Rooms, double Square,
    string Floor, bool NewBuilding, bool HasRoommate, double DistanceKm, int WalkMinutes, int CarMinutes, double Lat, double Lng);

public record SearchResponse(int Total, University University, string RouteSource, IReadOnlyList<HouseResult> Items);

public record PathStep(string Type, string? Modifier, string Name, int Meters, int Seconds);

public record PathResult(double DistanceKm, int Minutes, IReadOnlyList<double[]> Geometry, IReadOnlyList<PathStep> Steps, University University);
