using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace models.Migrations
{
    /// <inheritdoc />
    public partial class AddFinSlideTypeAndReadmeShares : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FinSlideType",
                table: "SkillCards",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "terminal");

            migrationBuilder.CreateTable(
                name: "CardReadmeShares",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CardId = table.Column<int>(type: "integer", nullable: false),
                    Nome = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    GithubLink = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CardReadmeShares", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CardReadmeShares_SkillCards_CardId",
                        column: x => x.CardId,
                        principalTable: "SkillCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CardReadmeShares_CardId",
                table: "CardReadmeShares",
                column: "CardId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CardReadmeShares");

            migrationBuilder.DropColumn(
                name: "FinSlideType",
                table: "SkillCards");
        }
    }
}
