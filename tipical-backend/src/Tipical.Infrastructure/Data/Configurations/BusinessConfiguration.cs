using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Tipical.Core.Models;

namespace Tipical.Infrastructure.Data.Configurations;

public class BusinessConfiguration : IEntityTypeConfiguration<Business>
{
    public void Configure(EntityTypeBuilder<Business> builder)
    {
        builder.ToTable("businesses");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(b => b.GooglePlaceId)
            .HasColumnName("google_place_id")
            .HasMaxLength(255);

        builder.HasIndex(b => b.GooglePlaceId)
            .IsUnique()
            .HasFilter("google_place_id IS NOT NULL");

        builder.Property(b => b.Name)
            .HasColumnName("name")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(b => b.Address)
            .HasColumnName("address")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(b => b.Latitude)
            .HasColumnName("latitude")
            .HasColumnType("decimal(10,7)")
            .IsRequired();

        builder.Property(b => b.Longitude)
            .HasColumnName("longitude")
            .HasColumnType("decimal(10,7)")
            .IsRequired();

        // PostGIS geography point for spatial queries
        builder.Property(b => b.Location)
            .HasColumnName("location")
            .HasColumnType("geography (point, 4326)");

        builder.Property(b => b.PlaceTypes)
            .HasColumnName("place_types")
            .HasColumnType("text[]");

        builder.Property(b => b.Phone)
            .HasColumnName("phone")
            .HasMaxLength(50);

        builder.Property(b => b.Website)
            .HasColumnName("website")
            .HasMaxLength(500);

        builder.Property(b => b.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(b => b.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasMany(b => b.TippingVotes)
            .WithOne(tv => tv.Business)
            .HasForeignKey(tv => tv.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
