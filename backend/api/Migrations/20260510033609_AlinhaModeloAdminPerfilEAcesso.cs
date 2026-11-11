using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations
{
    /// <inheritdoc />
    public partial class AlinhaModeloAdminPerfilEAcesso : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReferenciasRapidas_SkillCards_SkillCardId",
                table: "ReferenciasRapidas");

            migrationBuilder.DropIndex(
                name: "IX_ReferenciasRapidas_SkillCardId",
                table: "ReferenciasRapidas");

            migrationBuilder.DropColumn(
                name: "SkillCardId",
                table: "ReferenciasRapidas");

            migrationBuilder.CreateIndex(
                name: "IX_ReferenciasRapidas_CardId",
                table: "ReferenciasRapidas",
                column: "CardId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReferenciasRapidas_SkillCards_CardId",
                table: "ReferenciasRapidas",
                column: "CardId",
                principalTable: "SkillCards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ReferenciasRapidas_SkillCards_CardId",
                table: "ReferenciasRapidas");

            migrationBuilder.DropIndex(
                name: "IX_ReferenciasRapidas_CardId",
                table: "ReferenciasRapidas");

            migrationBuilder.AddColumn<int>(
                name: "SkillCardId",
                table: "ReferenciasRapidas",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReferenciasRapidas_SkillCardId",
                table: "ReferenciasRapidas",
                column: "SkillCardId");

            migrationBuilder.AddForeignKey(
                name: "FK_ReferenciasRapidas_SkillCards_SkillCardId",
                table: "ReferenciasRapidas",
                column: "SkillCardId",
                principalTable: "SkillCards",
                principalColumn: "Id");
        }
    }
}
