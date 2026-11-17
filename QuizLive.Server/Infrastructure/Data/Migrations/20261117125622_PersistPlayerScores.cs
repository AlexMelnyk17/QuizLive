using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizLive.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class PersistPlayerScores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TotalScore",
                table: "Players",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("UPDATE Players SET TotalScore = COALESCE((SELECT SUM(Points) FROM QuizAnswers WHERE PlayerId = Players.Id), 0)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalScore",
                table: "Players");
        }
    }
}
