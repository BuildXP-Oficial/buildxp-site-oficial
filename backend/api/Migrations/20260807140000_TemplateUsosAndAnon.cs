using BuildXP.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260807140000_TemplateUsosAndAnon")]
public partial class TemplateUsosAndAnon : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "UsosCount",
            table: "MarkdownSharedTemplates",
            type: "integer",
            nullable: false,
            defaultValue: 0);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "UsosCount",
            table: "MarkdownSharedTemplates");
    }
}
