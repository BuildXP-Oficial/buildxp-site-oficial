using BuildXP.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260523120000_FeedbackCategoria")]
public partial class FeedbackCategoria : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Categoria",
            table: "Feedbacks",
            type: "character varying(40)",
            maxLength: 40,
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql(
            """
            UPDATE "Feedbacks"
            SET "Categoria" = COALESCE(
                NULLIF(substring("Mensagem" from '^\[([^\]]+)\]'), ''),
                'Feedback'
            ),
            "Mensagem" = trim(regexp_replace("Mensagem", '^\[[^\]]+\]\s*', ''))
            WHERE "Mensagem" ~ '^\[[^\]]+\]';
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE "Feedbacks"
            SET "Mensagem" = CASE
                WHEN "Categoria" IS NOT NULL AND "Categoria" <> '' THEN '[' || "Categoria" || ']' || E'\n\n' || "Mensagem"
                ELSE "Mensagem"
            END
            WHERE "Categoria" IS NOT NULL AND "Categoria" <> '';
            """);

        migrationBuilder.DropColumn(
            name: "Categoria",
            table: "Feedbacks");
    }
}
