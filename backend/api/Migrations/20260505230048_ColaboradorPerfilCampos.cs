using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations
{
    /// <inheritdoc />
    public partial class ColaboradorPerfilCampos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Senha",
                table: "Colaboradores",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Colaboradores",
                type: "character varying(320)",
                maxLength: 320,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<byte[]>(
                name: "FotoBytes",
                table: "Colaboradores",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FotoMimeType",
                table: "Colaboradores",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Usuario",
                table: "Colaboradores",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Colaboradores_Usuario",
                table: "Colaboradores",
                column: "Usuario",
                unique: true,
                filter: "\"Usuario\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Colaboradores_Usuario",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "FotoBytes",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "FotoMimeType",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "Usuario",
                table: "Colaboradores");

            migrationBuilder.AlterColumn<string>(
                name: "Senha",
                table: "Colaboradores",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Colaboradores",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(320)",
                oldMaxLength: 320);
        }
    }
}
