using BuildXP.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations;

/// <summary>Adiciona flag de acesso ao painel de administração (convites, lista de colaboradores).</summary>
[DbContext(typeof(AppDbContext))]
[Migration("20260510041000_ColaboradorAcessoAdministrador")]
public partial class ColaboradorAcessoAdministrador : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "AcessoAdministrador",
            table: "Colaboradores",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "AcessoAdministrador",
            table: "Colaboradores");
    }
}
