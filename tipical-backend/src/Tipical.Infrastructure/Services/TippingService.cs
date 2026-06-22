using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Tipical.Core.DTOs;
using Tipical.Core.Repositories;
using Tipical.Core.Models;
using Tipical.Core.Services;
using Tipical.Infrastructure.Data;

namespace Tipical.Infrastructure.Services;

public class TippingService(
    ITippingVoteRepository tippingVoteRepository,
    IBusinessRepository businessRepository,
    ApplicationDbContext context) : ITippingService
{
    public async Task<TippingVoteResponse> SubmitReportAsync(string googlePlaceId, string userId, TippingPolicy policy, string name, double latitude, double longitude)
    {
        var location = new Point(longitude, latitude) { SRID = GeoConstants.Wgs84Srid };

        await using var tx = await context.Database.BeginTransactionAsync();
        var business = await businessRepository.GetOrCreateAsync(googlePlaceId, name, location);
        var report = await tippingVoteRepository.UpsertAsync(business.Id, userId, policy);
        await tx.CommitAsync();

        return new TippingVoteResponse
        {
            Id = report.Id,
            GooglePlaceId = googlePlaceId,
            TippingPolicy = report.TippingPolicy,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt
        };
    }

    public async Task<TippingVotesAggregateResponse> GetReportsAggregateAsync(string googlePlaceId)
    {
        var business = await businessRepository.GetByGooglePlaceIdAsync(googlePlaceId);

        var reportCounts = business?.TippingVotes
            .GroupBy(v => v.TippingPolicy)
            .ToDictionary(g => g.Key, g => g.Count())
            ?? new Dictionary<TippingPolicy, int>();

        TippingPolicy? winningPolicy = null;
        int? winningPolicyVoteCount = null;
        var totalReports = reportCounts.Sum(kvp => kvp.Value);

        if (reportCounts.Count != 0)
        {
            var winner = reportCounts.OrderByDescending(kvp => kvp.Value).First();
            winningPolicy = winner.Key;
            winningPolicyVoteCount = winner.Value;
        }

        return new TippingVotesAggregateResponse
        {
            GooglePlaceId = googlePlaceId,
            WinningPolicy = winningPolicy,
            WinningPolicyVoteCount = winningPolicyVoteCount,
            VotesByPolicy = reportCounts,
            TotalVotes = totalReports
        };
    }

    public async Task<TippingVoteResponse?> GetUserReportAsync(string googlePlaceId, string userId)
    {
        var business = await businessRepository.GetByGooglePlaceIdAsync(googlePlaceId);
        if (business == null) return null;

        var report = business.TippingVotes.FirstOrDefault(v => v.UserId == userId);
        if (report == null) return null;

        return new TippingVoteResponse
        {
            Id = report.Id,
            GooglePlaceId = googlePlaceId,
            TippingPolicy = report.TippingPolicy,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt
        };
    }
}
