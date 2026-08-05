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
            var token = await GetAccessTokenAsync(cancellationToken);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var response = await base.SendAsync(request, cancellationToken);
            await LogResponseAsync(response, cancellationToken);
            return response;
        }

        // The OTLP exporter sends requests via this synchronous method, not SendAsync.
        protected override HttpResponseMessage Send(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var token = GetAccessTokenAsync(cancellationToken).GetAwaiter().GetResult();
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var response = base.Send(request, cancellationToken);
            LogResponseAsync(response, cancellationToken).GetAwaiter().GetResult();
            return response;
        }

        // TEMPORARY DIAGNOSTIC (#227): the OTel SDK swallows export failures with no
        // visibility into app logs; this surfaces the raw Cloud Trace response to find
        // out why spans still aren't showing up. Remove once resolved.
        private static async Task LogResponseAsync(HttpResponseMessage response, CancellationToken cancellationToken)
        {
            if (response.IsSuccessStatusCode)
            {
                Console.Error.WriteLine($"[OTLP export] {(int)response.StatusCode} {response.StatusCode}");
            }
            else
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                Console.Error.WriteLine($"[OTLP export] {(int)response.StatusCode} {response.StatusCode}: {body}");
            }
        }

        private static async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
        {
            var credential = await Credential.Value;
            return await ((ITokenAccess)credential).GetAccessTokenForRequestAsync(cancellationToken: cancellationToken);
        }
    }
}
