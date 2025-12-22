using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecipeManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCollectionPreviewImageContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "PreviewImageContent",
                table: "Collections",
                type: "BLOB",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreviewImageContentType",
                table: "Collections",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreviewImageContent",
                table: "Collections");

            migrationBuilder.DropColumn(
                name: "PreviewImageContentType",
                table: "Collections");
        }
    }
}
