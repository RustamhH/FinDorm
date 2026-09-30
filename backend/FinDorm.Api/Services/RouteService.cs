using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;
using AzeRealtor.Api.Models;

namespace AzeRealtor.Api.Services;

public record Route(double WalkKm, int WalkMinutes, double CarKm, int CarMinutes, bool Estimated);

/// <summary>
/// Real road routes from OSRM (car and foot), fetched once per university and cached on disk.
/// Falls back to a straight-line estimate if OSRM cannot be reached.
/// </summary>
public class RouteService(HttpClient http, IWebHostEnvironment env, ILogger<RouteService> log)
{
    private const string CarUrl = "https://router.project-osrm.org/table/v1/driving/";
    private const string CarRouteUrl = "https://router.project-osrm.org/route/v1/driving/";
    private const string FootRouteUrl = "https://routing.openstreetmap.de/routed-foot/route/v1/foot/";
    private const string FootUrl = "https://routing.openstreetmap.de/routed-foot/table/v1/foot/";

    private readonly ConcurrentDictionary<string, PathResult> _paths = new();
    private readonly string _cachePath = Path.Combine(env.ContentRootPath, "Data", "routes-cache.json");
    private readonly ConcurrentDictionary<string, Route> _cache = new();
    private readonly SemaphoreSlim _lock = new(1, 1);
    private bool _diskLoaded;

    public static string Key(University uni, double lat, double lng) =>
        string.Create(CultureInfo.InvariantCulture, $"{uni.Lat:F4},{uni.Lng:F4}|{lat:F4},{lng:F4}");

    public async Task<IReadOnlyDictionary<string, Route>> GetRoutesAsync(University uni, IReadOnlyList<(double Lat, double Lng)> points)
    {
        await _lock.WaitAsync();
        try
        {
            LoadDisk();
            var missing = points.Where(p => !_cache.TryGetValue(Key(uni, p.Lat, p.Lng), out var r) || r.Estimated).ToList();
            if (missing.Count > 0)
            {
                var fetched = await FetchAsync(uni, missing);
                foreach (var (p, route) in fetched) _cache[Key(uni, p.Lat, p.Lng)] = route;
                if (fetched.Any(f => !f.Route.Estimated)) SaveDisk();
            }
        }
        finally { _lock.Release(); }
        return _cache;
    }

    /// <summary>Turn-by-turn route from a house to the university (mode: "foot" or "car").</summary>
    public async Task<PathResult> GetPathAsync(University uni, double lat, double lng, string mode)
    {
        var car = mode == "car";
        var key = string.Create(CultureInfo.InvariantCulture, $"{mode}|{uni.Id}|{lat:F4},{lng:F4}");
        if (_paths.TryGetValue(key, out var hit)) return hit;

        var url = (car ? CarRouteUrl : FootRouteUrl) + string.Create(CultureInfo.InvariantCulture,
            $"{lng},{lat};{uni.Lng},{uni.Lat}?overview=full&geometries=geojson&steps=true");
        using var doc = JsonDocument.Parse(await http.GetStringAsync(url));
        var root = doc.RootElement;
        if (root.GetProperty("code").GetString() != "Ok") throw new InvalidOperationException("OSRM error");
        var route = root.GetProperty("routes")[0];

        var geometry = route.GetProperty("geometry").GetProperty("coordinates").EnumerateArray()
            .Select(c => new[] { c[1].GetDouble(), c[0].GetDouble() }).ToList();
        var steps = route.GetProperty("legs").EnumerateArray().SelectMany(leg => leg.GetProperty("steps").EnumerateArray())
            .Select(s =>
            {
                var man = s.GetProperty("maneuver");
                return new PathStep(man.GetProperty("type").GetString() ?? "",
                    man.TryGetProperty("modifier", out var mod) ? mod.GetString() : null,
                    s.GetProperty("name").GetString() ?? "",
                    (int)Math.Round(s.GetProperty("distance").GetDouble()),
                    (int)Math.Round(s.GetProperty("duration").GetDouble()));
            }).ToList();

        var result = new PathResult(Math.Round(route.GetProperty("distance").GetDouble() / 1000, 1),
            (int)Math.Round(route.GetProperty("duration").GetDouble() / 60), geometry, steps, uni);
        _paths[key] = result;
        return result;
    }

    private async Task<List<((double Lat, double Lng) P, Route Route)>> FetchAsync(University uni, List<(double Lat, double Lng)> pts)
    {
        try
        {
            var coords = string.Join(';', pts.Prepend((uni.Lat, uni.Lng)).Select(p => string.Create(CultureInfo.InvariantCulture, $"{p.Lng},{p.Lat}")));
            var dest = string.Join(';', Enumerable.Range(1, pts.Count));
            var qs = $"?sources=0&destinations={dest}&annotations=duration,distance";
            var (carD, carT) = await TableAsync(CarUrl + coords + qs);
            var (footD, footT) = await TableAsync(FootUrl + coords + qs);
            log.LogInformation("OSRM routes fetched for {Uni}", uni.Name);
            return pts.Select((p, i) => (p, new Route(
                Math.Round(footD[i] / 1000, 1), (int)Math.Round(footT[i] / 60),
                Math.Round(carD[i] / 1000, 1), (int)Math.Round(carT[i] / 60), false))).ToList();
        }
        catch (Exception ex)
        {
            log.LogWarning(ex, "OSRM unavailable, using straight-line estimate");
            return pts.Select(p =>
            {
                var km = Haversine(uni.Lat, uni.Lng, p.Lat, p.Lng) * 1.3;
                return (p, new Route(Math.Round(km, 1), (int)Math.Round(km * 12.8), Math.Round(km, 1), (int)Math.Round(4.6 + 2.4 * km), true));
            }).ToList();
        }
    }

    private async Task<(double[] Dist, double[] Dur)> TableAsync(string url)
    {
        using var doc = JsonDocument.Parse(await http.GetStringAsync(url));
        var root = doc.RootElement;
        if (root.GetProperty("code").GetString() != "Ok") throw new InvalidOperationException("OSRM error");
        double[] Row(string name) => root.GetProperty(name)[0].EnumerateArray()
            .Select(e => e.ValueKind == JsonValueKind.Null ? throw new InvalidOperationException("No route") : e.GetDouble()).ToArray();
        return (Row("distances"), Row("durations"));
    }

    private void LoadDisk()
    {
        if (_diskLoaded) return;
        _diskLoaded = true;
        try
        {
            if (!File.Exists(_cachePath)) return;
            var saved = JsonSerializer.Deserialize<Dictionary<string, Route>>(File.ReadAllText(_cachePath));
            foreach (var kv in saved ?? []) _cache[kv.Key] = kv.Value;
        }
        catch (Exception ex) { log.LogWarning(ex, "Could not read route cache"); }
    }

    private void SaveDisk()
    {
        try
        {
            var real = _cache.Where(kv => !kv.Value.Estimated).ToDictionary(kv => kv.Key, kv => kv.Value);
            File.WriteAllText(_cachePath, JsonSerializer.Serialize(real));
        }
        catch (Exception ex) { log.LogWarning(ex, "Could not write route cache"); }
    }

    private static double Haversine(double lat1, double lng1, double lat2, double lng2)
    {
        static double Rad(double d) => d * Math.PI / 180;
        var a = Math.Pow(Math.Sin(Rad(lat2 - lat1) / 2), 2) + Math.Cos(Rad(lat1)) * Math.Cos(Rad(lat2)) * Math.Pow(Math.Sin(Rad(lng2 - lng1) / 2), 2);
        return 2 * 6371 * Math.Asin(Math.Sqrt(a));
    }
}
