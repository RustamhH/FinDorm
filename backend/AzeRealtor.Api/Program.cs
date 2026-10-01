using System.Text.Json.Serialization;
using AzeRealtor.Api.Models;
using AzeRealtor.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<ListingRepository>();
builder.Services.AddHttpClient<RouteService>(c => { c.Timeout = TimeSpan.FromSeconds(20); c.DefaultRequestHeaders.UserAgent.ParseAdd("AzeRealtor/1.0"); });
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
// Extra allowed origins (e.g. the deployed Next.js site) via the ALLOWED_ORIGINS env var, comma-separated.
var extraOrigins = (Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(["http://localhost:3000", "http://127.0.0.1:3000", .. extraOrigins])
    .AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

app.MapGet("/", (ListingRepository repo) => new { status = "ok", listings = repo.Count, docs = "/api/universities" });

app.MapGet("/api/universities", () => Universities.All);

app.MapPost("/api/search", async (SearchRequest req, ListingRepository repo, RouteService routing) =>
{
    var uni = Universities.All.FirstOrDefault(u => u.Id == req.UniversityId);
    if (uni is null) return Results.BadRequest(new { error = "Unknown university" });
    var routes = await routing.GetRoutesAsync(uni, repo.Points);
    return Results.Ok(repo.Search(req, uni, routes));
});

app.MapGet("/api/route", async (int universityId, double lat, double lng, string? mode, RouteService routing) =>
{
    var uni = Universities.All.FirstOrDefault(u => u.Id == universityId);
    if (uni is null) return Results.BadRequest(new { error = "Unknown university" });
    try { return Results.Ok(await routing.GetPathAsync(uni, lat, lng, mode == "car" ? "car" : "foot")); }
    catch { return Results.Problem("Marşrut xidməti əlçatan deyil", statusCode: 502); }
});

app.Logger.LogInformation("Loaded {Count} listings", app.Services.GetRequiredService<ListingRepository>().Count);
app.Run();
