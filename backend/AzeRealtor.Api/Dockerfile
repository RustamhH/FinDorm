# Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY AzeRealtor.Api.csproj .
RUN dotnet restore AzeRealtor.Api.csproj
COPY . .
RUN dotnet publish AzeRealtor.Api.csproj -c Release -o /app --no-restore

# Run
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS run
WORKDIR /app
COPY --from=build /app .
EXPOSE 10000
# Render injects $PORT at runtime; fall back to 10000 for local `docker run`.
ENTRYPOINT ["sh", "-c", "ASPNETCORE_HTTP_PORTS=${PORT:-10000} dotnet AzeRealtor.Api.dll"]
