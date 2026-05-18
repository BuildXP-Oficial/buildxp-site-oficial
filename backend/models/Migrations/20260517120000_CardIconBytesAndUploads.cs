using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace models.Migrations
{
    /// <inheritdoc />
    public partial class CardIconBytesAndUploads : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "IconPrimaryBytes",
                table: "SkillCards",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IconPrimaryMimeType",
                table: "SkillCards",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "IconSecondaryBytes",
                table: "SkillCards",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IconSecondaryMimeType",
                table: "SkillCards",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CardIconUploads",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Data = table.Column<byte[]>(type: "bytea", nullable: false),
                    MimeType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CardIconUploads", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "CardIconUploads");

            migrationBuilder.DropColumn(name: "IconPrimaryBytes", table: "SkillCards");
            migrationBuilder.DropColumn(name: "IconPrimaryMimeType", table: "SkillCards");
            migrationBuilder.DropColumn(name: "IconSecondaryBytes", table: "SkillCards");
            migrationBuilder.DropColumn(name: "IconSecondaryMimeType", table: "SkillCards");
        }
    }
}
