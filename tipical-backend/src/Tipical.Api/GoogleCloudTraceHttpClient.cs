using System.Net.Http.Headers;
using Google.Apis.Auth.OAuth2;
using Google.Protobuf;
using OpenTelemetry.Proto.Collector.Trace.V1;

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
            await LogRequestAsync(request, cancellationToken);
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
            LogRequestAsync(request, cancellationToken).GetAwaiter().GetResult();
            var response = base.Send(request, cancellationToken);
            LogResponseAsync(response, cancellationToken).GetAwaiter().GetResult();
            return response;
        }

        // TEMPORARY DIAGNOSTIC (#227): we've only ever verified the response, never
        // what we actually send — if the payload is already empty/hollowed-out by the
        // time it reaches here (e.g. from some context/object-reuse issue upstream),
        // Cloud Trace would legitimately 200 an empty request and we'd never know.
        // Remove once resolved.
        private static async Task LogRequestAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.Content is null)
            {
                Console.Error.WriteLine("[OTLP export] request has no content");
                return;
            }

            var bytes = await request.Content.ReadAsByteArrayAsync(cancellationToken);
            try
            {
                var parsed = ExportTraceServiceRequest.Parser.ParseFrom(bytes);
                var json = JsonFormatter.Default.Format(parsed);
                Console.Error.WriteLine($"[OTLP export] sending {bytes.Length} request bytes: {json}");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[OTLP export] sending {bytes.Length} request bytes, failed to parse as ExportTraceServiceRequest: {ex.Message}");
            }
        }

        private static async Task LogResponseAsync(HttpResponseMessage response, CancellationToken cancellationToken)
        {
            // OTLP allows a 200 response that still rejects some/all spans via a
            // partial_success field in the (protobuf) body, so read it either way —
            // status code alone isn't enough to tell whether the export landed.
            var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
            try
            {
                var parsed = ExportTraceServiceResponse.Parser.ParseFrom(bytes);
                var json = JsonFormatter.Default.Format(parsed);
                Console.Error.WriteLine($"[OTLP export] {(int)response.StatusCode} {response.StatusCode}, {bytes.Length} body bytes: {json}");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[OTLP export] {(int)response.StatusCode} {response.StatusCode}, {bytes.Length} body bytes, failed to parse as ExportTraceServiceResponse: {ex.Message}");
            }
        }

        private static async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
        {
            var credential = await Credential.Value;
            return await ((ITokenAccess)credential).GetAccessTokenForRequestAsync(cancellationToken: cancellationToken);
        }
    }
}
