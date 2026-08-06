using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Tipical.Api;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Npgsql;
using OpenTelemetry;
using OpenTelemetry.Exporter;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using System.Diagnostics;
using System.Reflection;
using System.Text;
using System.Threading.RateLimiting;
using Tipical.Core.Repositories;
using Tipical.Core.Services;
using Tipical.Core.Models;
using Tipical.Infrastructure.Data;
using Tipical.Infrastructure.Repositories;
using Tipical.Infrastructure.Services;

// Bootstrap logger: captures anything logged before the host (and its
// configuration-driven Serilog setup) is built. Replaced by the configured
// logger once the host is up.
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting Tipical API");

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog from appsettings (Console locally, Google Cloud Logging in
// the deployed Production environment). ReadFrom.Services lets registered
// enrichers/sinks participate in the pipeline.
builder.Services.AddSerilog((services, loggerConfiguration) => loggerConfiguration
    .ReadFrom.Configuration(builder.Configuration)
    .ReadFrom.Services(services));

// Configure OpenTelemetry tracing: console exporter locally, OTLP to Cloud Trace in
// the deployed Production environment (see OpenTelemetry:Otlp:Endpoint in appsettings).
var otlpEndpoint = builder.Configuration["OpenTelemetry:Otlp:Endpoint"];
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource =>
    {
        resource.AddService(
            serviceName: builder.Configuration["OpenTelemetry:ServiceName"] ?? "tipical-api",
            serviceVersion: builder.Configuration["OpenTelemetry:ServiceVersion"]);

        if (!string.IsNullOrEmpty(otlpEndpoint))
        {
            var gcpProjectId = builder.Configuration["OpenTelemetry:GcpProjectId"]
                ?? throw new InvalidOperationException("GCP project ID not configured");
            resource.AddAttributes([new KeyValuePair<string, object>("gcp.project_id", gcpProjectId)]);
        }
    })
    .WithTracing(tracing =>
    {
        tracing.AddAspNetCoreInstrumentation()
            .AddGrpcClientInstrumentation()
            .AddHttpClientInstrumentation()
            .AddNpgsql();

        if (string.IsNullOrEmpty(otlpEndpoint))
        {
            tracing.AddConsoleExporter();
        }
        else
        {
            tracing.AddOtlpExporter(otlp =>
            {
                otlp.Protocol = OtlpExportProtocol.HttpProtobuf;
                otlp.Endpoint = new Uri(otlpEndpoint);
                otlp.HttpClientFactory = GoogleCloudTraceHttpClient.Create;
            });
        }
    });

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TipScape API",
        Version = "v1",
        Description = "Crowd-sourced tipping policy data for local businesses."
    });

    var xmlPath = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
    c.IncludeXmlComments(xmlPath);

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT access token."
    });

    c.SchemaFilter<EnumSchemaFilter>();
    c.OperationFilter<AuthorizeOperationFilter>();

    c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer", doc), new List<string>() }
    });
});

// Configure PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.MapEnum<TippingPolicy>().UseNetTopologySuite()
    )
);

// Configure JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "TipicalApi";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "TipicalApp";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("suggestions", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.Configure<AllowedUsersOptions>(builder.Configuration.GetSection("AllowedUsers"));

// Configure CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Register repositories
builder.Services.AddScoped<IBusinessRepository, BusinessRepository>();
builder.Services.AddScoped<ITippingVoteRepository, TippingVoteRepository>();
builder.Services.AddScoped<ISuggestionRepository, SuggestionRepository>();

// Register services
builder.Services.AddScoped<IGooglePlacesService, GooglePlacesService>();
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddScoped<IBusinessService, BusinessService>();
builder.Services.AddScoped<ITippingService, TippingService>();
builder.Services.AddScoped<ISuggestionService, SuggestionService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Emit a single structured log entry per HTTP request (method, path, status,
// elapsed time) instead of the framework's noisy multi-line default.
app.UseSerilogRequestLogging(options =>
{
    // Attach the matched route template (e.g. "api/venues/{id}") alongside the
    // raw request path, so logs can be grouped/aggregated by endpoint instead
    // of fragmenting by every distinct path segment value.
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        if (httpContext.GetEndpoint() is RouteEndpoint routeEndpoint)
        {
            diagnosticContext.Set("RouteTemplate", routeEndpoint.RoutePattern.RawText);
        }
    };
});

// TODO: deprecate as part of #227
// Flushes the OTLP batch exporter once per request, right when ASP.NET Core actually
// stops the request's Activity (HttpRequestIn.Stop fires after the whole middleware
// pipeline returns to the hosting layer — later than any app.Use() callback could hook
// into), so the flush reliably includes this request's own spans, batched into one
// export call instead of one call per span.
var tracerProvider = app.Services.GetRequiredService<TracerProvider>();
DiagnosticListener.AllListeners.Subscribe(new DelegateObserver<DiagnosticListener>(listener =>
{
    if (listener.Name != "Microsoft.AspNetCore") return;
    listener.Subscribe(new DelegateObserver<KeyValuePair<string, object?>>(evt =>
    {
        if (evt.Key != "Microsoft.AspNetCore.Hosting.HttpRequestIn.Stop") return;
        try
        {
            tracerProvider.ForceFlush(5000);
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Failed to force-flush OpenTelemetry traces");
        }
    }));
}));

// Global exception handling
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = "An unexpected error occurred" });
    });
});

app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

    app.Run();
}
// HostAbortedException is thrown intentionally by EF Core design-time tools
// (e.g. `dotnet ef migrations`/`database update`) to stop before app.Run();
// it isn't a real failure, so don't log it as fatal.
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Tipical API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// TODO: deprecate as part of #227
file sealed class DelegateObserver<T>(Action<T> onNext) : IObserver<T>
{
    public void OnNext(T value) => onNext(value);
    public void OnError(Exception error) { }
    public void OnCompleted() { }
}
