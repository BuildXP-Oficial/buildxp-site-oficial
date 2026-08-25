using BuildXP.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace models.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260803220000_MarkdownBuilder")]
public partial class MarkdownBuilder : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "MarkdownBuilderUsers",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                Usuario = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                Nome = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                SenhaHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                SecurityQuestionId = table.Column<int>(type: "integer", nullable: false),
                SecurityAnswerHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_MarkdownBuilderUsers", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_MarkdownBuilderUsers_Usuario",
            table: "MarkdownBuilderUsers",
            column: "Usuario",
            unique: true);

        migrationBuilder.CreateTable(
            name: "MarkdownBuilderDocs",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                UserId = table.Column<int>(type: "integer", nullable: false),
                Titulo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                ConteudoMarkdown = table.Column<string>(type: "text", nullable: false),
                Pitch = table.Column<string>(type: "text", nullable: false),
                Arquitetura = table.Column<string>(type: "text", nullable: false),
                RegrasEvento = table.Column<string>(type: "text", nullable: false),
                XpDocCriada = table.Column<bool>(type: "boolean", nullable: false),
                XpProjetoAtualizado = table.Column<bool>(type: "boolean", nullable: false),
                XpReadmeCompleto = table.Column<bool>(type: "boolean", nullable: false),
                XpTotal = table.Column<int>(type: "integer", nullable: false),
                CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_MarkdownBuilderDocs", x => x.Id);
                table.ForeignKey(
                    name: "FK_MarkdownBuilderDocs_MarkdownBuilderUsers_UserId",
                    column: x => x.UserId,
                    principalTable: "MarkdownBuilderUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_MarkdownBuilderDocs_UserId",
            table: "MarkdownBuilderDocs",
            column: "UserId",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "MarkdownBuilderDocs");
        migrationBuilder.DropTable(name: "MarkdownBuilderUsers");
    }
}
