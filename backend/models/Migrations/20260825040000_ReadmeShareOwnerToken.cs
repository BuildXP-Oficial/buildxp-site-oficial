using System;
using BuildXP.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260825040000_ReadmeShareOwnerToken")]
    public partial class ReadmeShareOwnerToken : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OwnerToken",
                table: "CardReadmeShares",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OwnerToken",
                table: "CardReadmeShares");
        }
    }
}
