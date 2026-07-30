using System.Net.Http.Headers;
using Google.Apis.Auth.OAuth2;

namespace Tipical.Api;

// Cloud Trace's OTLP endpoint (telemetry.googleapis.com) is an authenticated Google
// API, unlike a typical OTLP collector. This attaches a bearer token from the Cloud
// Run service's Application Default Credentials to every export request. The token
// is re-requested per call rather than cached here because GoogleCredential already
// caches it internally and only refreshes once it's near expiry.
internal static class GoogleCloudTraceHttpClient
{
    private static readonly string[] Scopes = ["https://www.googleapis.com/auth/trace.append"];

    private static readonly Lazy<Task<GoogleCredential>> Credential = new(async () =>
        (await GoogleCredential.GetApplicationDefaultAsync()).CreateScoped(Scopes));

    public static HttpClient Create() => new(new AuthenticatingHandler());

    private sealed class AuthenticatingHandler() : DelegatingHandler(new HttpClientHandler())
    {
        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var credential = await Credential.Value;
            var token = await ((ITokenAccess)credential).GetAccessTokenForRequestAsync(cancellationToken: cancellationToken);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            return await base.SendAsync(request, cancellationToken);
        }
    }
}
