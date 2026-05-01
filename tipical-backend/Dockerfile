# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files and pre-create bin/ directories.
# bin/Debug and bin/Release must exist before dotnet build runs: MSBuild's glob
# expansion on Linux fails with DirectoryNotFoundException if they're absent,
# falling back to treating **/*.resx / **/*.cs as literal paths (MSB3552 / CS2001).
COPY .config/ .config/
COPY src/Tipical.Api/Tipical.Api.csproj src/Tipical.Api/
COPY src/Tipical.Core/Tipical.Core.csproj src/Tipical.Core/
COPY src/Tipical.Infrastructure/Tipical.Infrastructure.csproj src/Tipical.Infrastructure/
RUN mkdir -p src/Tipical.Api/bin/Debug         src/Tipical.Api/bin/Release \
             src/Tipical.Core/bin/Debug        src/Tipical.Core/bin/Release \
             src/Tipical.Infrastructure/bin/Debug src/Tipical.Infrastructure/bin/Release

# Restore dependencies and local tools
RUN dotnet restore src/Tipical.Api/Tipical.Api.csproj
RUN dotnet tool restore

# Copy everything else and build
COPY . .
WORKDIR /src/src/Tipical.Api
RUN dotnet build -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

# Build self-contained EF migrations bundle for Cloud Run migration job
WORKDIR /src
RUN dotnet ef migrations bundle \
    --project src/Tipical.Infrastructure/Tipical.Infrastructure.csproj \
    --startup-project src/Tipical.Api/Tipical.Api.csproj \
    --self-contained -r linux-x64 \
    --configuration Release \
    -o /app/publish/efbundle

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Tipical.Api.dll"]
