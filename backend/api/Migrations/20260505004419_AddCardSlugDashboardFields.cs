using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations
{
    /// <inheritdoc />
    public partial class AddCardSlugDashboardFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Titulo",
                table: "SkillCards",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(60)",
                oldMaxLength: 60);

            migrationBuilder.AlterColumn<string>(
                name: "Raridade",
                table: "SkillCards",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<string>(
                name: "Icone",
                table: "SkillCards",
                type: "character varying(512)",
                maxLength: 512,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);

            migrationBuilder.AlterColumn<string>(
                name: "Descricao",
                table: "SkillCards",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(300)",
                oldMaxLength: 300);

            migrationBuilder.AlterColumn<string>(
                name: "Classe",
                table: "SkillCards",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40);

            migrationBuilder.AddColumn<string>(
                name: "BtnPrimaryLabel",
                table: "SkillCards",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BtnSecondaryLabel",
                table: "SkillCards",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IconLayout",
                table: "SkillCards",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IconPrimaryAlt",
                table: "SkillCards",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IconPrimarySrc",
                table: "SkillCards",
                type: "character varying(512)",
                maxLength: 512,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IconSecondaryAlt",
                table: "SkillCards",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IconSecondarySrc",
                table: "SkillCards",
                type: "character varying(512)",
                maxLength: 512,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LinkBeginner",
                table: "SkillCards",
                type: "character varying(512)",
                maxLength: 512,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LinkRef",
                table: "SkillCards",
                type: "character varying(512)",
                maxLength: 512,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "SkillCards",
                type: "character varying(48)",
                maxLength: 48,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Theme",
                table: "SkillCards",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_SkillCards_Slug",
                table: "SkillCards",
                column: "Slug",
                unique: true,
                filter: "\"Slug\" <> ''");

            // Preenche slug/theme pelos 4 cards padrão (Ordem 0–3) quando ainda estão vazios.
            migrationBuilder.Sql(
                """
                UPDATE "SkillCards" AS s
                SET "Slug" = v.slug,
                    "Theme" = CASE WHEN s."Theme" = '' THEN v.slug ELSE s."Theme" END
                FROM (VALUES (0, 'git'), (1, 'docker'), (2, 'npm'), (3, 'dotnet')) AS v(ord, slug)
                WHERE s."Ordem" = v.ord AND s."Slug" = '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SkillCards_Slug",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "BtnPrimaryLabel",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "BtnSecondaryLabel",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "IconLayout",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "IconPrimaryAlt",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "IconPrimarySrc",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "IconSecondaryAlt",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "IconSecondarySrc",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "LinkBeginner",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "LinkRef",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "SkillCards");

            migrationBuilder.DropColumn(
                name: "Theme",
                table: "SkillCards");

            migrationBuilder.AlterColumn<string>(
                name: "Titulo",
                table: "SkillCards",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(120)",
                oldMaxLength: 120);

            migrationBuilder.AlterColumn<string>(
                name: "Raridade",
                table: "SkillCards",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "Icone",
                table: "SkillCards",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(512)",
                oldMaxLength: 512);

            migrationBuilder.AlterColumn<string>(
                name: "Descricao",
                table: "SkillCards",
                type: "character varying(300)",
                maxLength: 300,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Classe",
                table: "SkillCards",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(60)",
                oldMaxLength: 60);
        }
    }
}
