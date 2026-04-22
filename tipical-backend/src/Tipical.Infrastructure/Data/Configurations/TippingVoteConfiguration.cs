using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tipical.Core.Models;

namespace Tipical.Infrastructure.Data.Configurations;

public class TippingVoteConfiguration : IEntityTypeConfiguration<TippingVote>
{
    public void Configure(EntityTypeBuilder<TippingVote> builder)
    {
        builder.ToTable("tipping_votes");

        builder.HasKey(tv => tv.Id);

        builder.Property(tv => tv.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(tv => tv.BusinessId)
            .HasColumnName("business_id")
            .IsRequired();

        builder.Property(tv => tv.UserId)
            .HasColumnName("user_id")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(tv => tv.TippingPolicy)
            .HasColumnName("tipping_policy")
            .IsRequired();

        builder.Property(tv => tv.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(tv => tv.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        // Unique constraint: one vote per user per business
        builder.HasIndex(tv => new { tv.BusinessId, tv.UserId })
            .IsUnique()
            .HasDatabaseName("ix_tipping_votes_business_user");

        builder.HasOne(tv => tv.Business)
            .WithMany(b => b.TippingVotes)
            .HasForeignKey(tv => tv.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
