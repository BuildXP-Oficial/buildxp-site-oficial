using BuildXP.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260807120000_MultipleSharedMarkdownTemplates")]
public partial class MultipleSharedMarkdownTemplates : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_MarkdownSharedTemplates_OwnerUserId",
            table: "MarkdownSharedTemplates");

        migrationBuilder.AddColumn<string>(
            name: "Descricao",
            table: "MarkdownSharedTemplates",
            type: "character varying(280)",
            maxLength: 280,
            nullable: false,
            defaultValue: "");

        migrationBuilder.CreateIndex(
            name: "IX_MarkdownSharedTemplates_OwnerUserId",
            table: "MarkdownSharedTemplates",
            column: "OwnerUserId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_MarkdownSharedTemplates_OwnerUserId",
            table: "MarkdownSharedTemplates");

        migrationBuilder.DropColumn(
            name: "Descricao",
            table: "MarkdownSharedTemplates");

        migrationBuilder.CreateIndex(
            name: "IX_MarkdownSharedTemplates_OwnerUserId",
            table: "MarkdownSharedTemplates",
            column: "OwnerUserId",
            unique: true);
    }
}
