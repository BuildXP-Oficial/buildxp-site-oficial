using BuildXP.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260825030000_ReadmeShareOptionalCard")]
    public partial class ReadmeShareOptionalCard : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CardReadmeShares_SkillCards_CardId",
                table: "CardReadmeShares");

            migrationBuilder.AlterColumn<int>(
                name: "CardId",
                table: "CardReadmeShares",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_CardReadmeShares_SkillCards_CardId",
                table: "CardReadmeShares",
                column: "CardId",
                principalTable: "SkillCards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CardReadmeShares_SkillCards_CardId",
                table: "CardReadmeShares");

            migrationBuilder.AlterColumn<int>(
                name: "CardId",
                table: "CardReadmeShares",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_CardReadmeShares_SkillCards_CardId",
                table: "CardReadmeShares",
                column: "CardId",
                principalTable: "SkillCards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
