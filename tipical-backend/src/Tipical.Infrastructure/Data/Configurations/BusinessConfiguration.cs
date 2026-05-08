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
            .ValueGeneratedOnAdd()
            .HasDefaultValueSql("uuidv7()");

        builder.Property(b => b.GooglePlaceId)
            .HasColumnName("google_place_id")
            .HasMaxLength(255)
            .IsRequired();

        builder.HasIndex(b => b.GooglePlaceId)
            .IsUnique();

        builder.Property(b => b.Name)
            .HasColumnName("name")
            .HasMaxLength(500);

        builder.HasIndex(b => b.Name);

        builder.Property(b => b.Location)
            .HasColumnName("location")
            .HasColumnType("geography (point)");

        builder.HasIndex(b => b.Location)
            .HasMethod("GIST");

        builder.HasMany(b => b.TippingVotes)
            .WithOne(tv => tv.Business)
            .HasForeignKey(tv => tv.BusinessId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
