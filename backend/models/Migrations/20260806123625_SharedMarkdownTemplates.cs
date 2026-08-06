using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace models.Migrations
{
    /// <inheritdoc />
    public partial class SharedMarkdownTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MarkdownSharedTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OwnerUserId = table.Column<int>(type: "integer", nullable: false),
                    TituloModelo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    ConteudoMarkdown = table.Column<string>(type: "text", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarkdownSharedTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarkdownSharedTemplates_MarkdownBuilderUsers_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "MarkdownBuilderUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MarkdownSharedTemplates_Ativo",
                table: "MarkdownSharedTemplates",
                column: "Ativo");

            migrationBuilder.CreateIndex(
                name: "IX_MarkdownSharedTemplates_OwnerUserId",
                table: "MarkdownSharedTemplates",
                column: "OwnerUserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MarkdownSharedTemplates");
        }
    }
}
