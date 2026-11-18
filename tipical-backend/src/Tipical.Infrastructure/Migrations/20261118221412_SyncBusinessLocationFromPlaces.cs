using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tipical.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncBusinessLocationFromPlaces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_businesses_name",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "name",
                table: "businesses");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_synced_at",
                table: "businesses",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_synced_at",
                table: "businesses");

            migrationBuilder.AddColumn<string>(
                name: "name",
                table: "businesses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_businesses_name",
                table: "businesses",
                column: "name");
        }
    }
}
