using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Tipical.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessLocationAndName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:tipping_policy", "no_tips,tips_exclude_tax,tips_include_tax")
                .Annotation("Npgsql:PostgresExtension:postgis", ",,")
                .OldAnnotation("Npgsql:Enum:tipping_policy", "no_tips,tips_exclude_tax,tips_include_tax");

            migrationBuilder.AddColumn<Point>(
                name: "location",
                table: "businesses",
                type: "geography (point)",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "name",
                table: "businesses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false);

            migrationBuilder.CreateIndex(
                name: "IX_businesses_location",
                table: "businesses",
                column: "location")
                .Annotation("Npgsql:IndexMethod", "GIST");

            migrationBuilder.CreateIndex(
                name: "IX_businesses_name",
                table: "businesses",
                column: "name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_businesses_location",
                table: "businesses");

            migrationBuilder.DropIndex(
                name: "IX_businesses_name",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "location",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "name",
                table: "businesses");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:tipping_policy", "no_tips,tips_exclude_tax,tips_include_tax")
                .OldAnnotation("Npgsql:Enum:tipping_policy", "no_tips,tips_exclude_tax,tips_include_tax")
                .OldAnnotation("Npgsql:PostgresExtension:postgis", ",,");
        }
    }
}
