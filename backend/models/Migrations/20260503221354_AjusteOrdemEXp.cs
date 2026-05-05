using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations
{
    /// <inheritdoc />
    public partial class AjusteOrdemEXp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "XPMaximo",
                table: "SkillCards",
                newName: "XpMaximo");

            migrationBuilder.RenameColumn(
                name: "XPAtual",
                table: "SkillCards",
                newName: "XpAtual");

            migrationBuilder.RenameColumn(
                name: "Posicao",
                table: "SkillCards",
                newName: "Ordem");

            migrationBuilder.RenameColumn(
                name: "AtualizadoEm",
                table: "Feedbacks",
                newName: "AvaliadoEm");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AtualizadoEm",
                table: "SkillCards",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "XpMaximo",
                table: "SkillCards",
                newName: "XPMaximo");

            migrationBuilder.RenameColumn(
                name: "XpAtual",
                table: "SkillCards",
                newName: "XPAtual");

            migrationBuilder.RenameColumn(
                name: "Ordem",
                table: "SkillCards",
                newName: "Posicao");

            migrationBuilder.RenameColumn(
                name: "AvaliadoEm",
                table: "Feedbacks",
                newName: "AtualizadoEm");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AtualizadoEm",
                table: "SkillCards",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");
        }
    }
}
