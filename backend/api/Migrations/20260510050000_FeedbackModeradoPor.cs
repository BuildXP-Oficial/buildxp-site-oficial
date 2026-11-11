using BuildXP.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260510050000_FeedbackModeradoPor")]
public partial class FeedbackModeradoPor : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ModeradoPor",
            table: "Feedbacks",
            type: "character varying(120)",
            maxLength: 120,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ModeradoPor",
            table: "Feedbacks");
    }
}
