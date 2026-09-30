using System.Globalization;
using AzeRealtor.Api.Models;

namespace AzeRealtor.Api.Services;

/// <summary>Loads housedata.csv once at startup and answers search queries in memory.</summary>
public class ListingRepository
{
    private readonly IReadOnlyList<Listing> _listings;

    public ListingRepository(IWebHostEnvironment env)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "housedata.csv");
        _listings = Load(path);
    }

    public int Count => _listings.Count;

    private static List<Listing> Load(string path)
    {
        var inv = CultureInfo.InvariantCulture;
        var list = new List<Listing>();
        foreach (var line in File.ReadLines(path).Skip(1))
        {
            var c = line.Split(',');
            if (c.Length < 11) continue;
            list.Add(new Listing(
                int.Parse(c[0], inv), decimal.Parse(c[1], inv), c[2], int.Parse(c[3], inv),
                double.Parse(c[4], inv), c[5], c[6] == "1", c[8] == "1", double.Parse(c[9], inv), double.Parse(c[10], inv)));
        }
        return list;
    }

    private static IOrderedEnumerable<HouseResult> Sort(List<HouseResult> items, SortBy sort) => sort switch
    {
        SortBy.PriceDesc => items.OrderBy(m => m.DistanceKm).ThenByDescending(m => m.Price),
        SortBy.PriceAsc => items.OrderBy(m => m.DistanceKm).ThenBy(m => m.Price),
        _ => items.OrderBy(m => m.DistanceKm).ThenBy(m => m.Price),
    };

    public IReadOnlyList<(double Lat, double Lng)> Points =>
        _listings.Select(l => (Math.Round(l.Lat, 4), Math.Round(l.Lng, 4))).Distinct().ToList();

    public SearchResponse Search(SearchRequest q, University uni, IReadOnlyDictionary<string, Route> routes)
    {
        var matches = new List<HouseResult>();
        var estimated = false;
        foreach (var l in _listings)
        {
            if (q.Rooms > 0 && (q.Rooms >= 5 ? l.Rooms < 5 : l.Rooms != q.Rooms)) continue;

            if (q.Mode == LivingMode.Mate && !l.HasRoommate) continue;
            if (q.Mode == LivingMode.Solo && l.HasRoommate) continue;
            if (l.Price > q.Budget) continue;

            if (!routes.TryGetValue(RouteService.Key(uni, l.Lat, l.Lng), out var r)) continue;
            estimated |= r.Estimated;
            matches.Add(new HouseResult(l.Id, l.Location, l.Price, l.Rooms, l.Square, l.Floor,
                l.NewBuilding, l.HasRoommate, r.WalkKm, r.WalkMinutes, r.CarMinutes, l.Lat, l.Lng));
        }

        var page = Sort(matches, q.Sort)
            .Skip(Math.Max(q.Skip, 0)).Take(Math.Clamp(q.Take, 1, 50)).ToList();
        return new SearchResponse(matches.Count, uni, estimated ? "estimate" : "osrm", page);
    }

}
