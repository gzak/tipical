using Microsoft.EntityFrameworkCore;
using Tipical.Core.Models;

namespace Tipical.Infrastructure.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<AllowedUser> AllowedUsers { get; set; }
    public DbSet<Business> Businesses { get; set; }
    public DbSet<TippingVote> TippingVotes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
