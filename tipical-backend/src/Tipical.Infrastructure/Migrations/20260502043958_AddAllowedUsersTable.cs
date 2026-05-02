using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tipical.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAllowedUsersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "allowed_users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_allowed_users", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_allowed_users_email",
                table: "allowed_users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "allowed_users");
        }
    }
}
