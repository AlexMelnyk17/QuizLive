using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizLive.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AllowOneActiveGamePerQuiz : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing duplicates would make the unique index fail: end all active games of a quiz except the newest.
            migrationBuilder.Sql(
                """
                UPDATE "GameSessionRecords"
                SET "Status" = 'Finished', "EndedAtUtc" = strftime('%Y-%m-%d %H:%M:%f', 'now')
                WHERE "EndedAtUtc" IS NULL
                  AND "Id" NOT IN (
                      SELECT MAX("Id") FROM "GameSessionRecords"
                      WHERE "EndedAtUtc" IS NULL
                      GROUP BY "QuizId");
                """);

            migrationBuilder.CreateIndex(
                name: "IX_GameSessionRecords_QuizId_Active",
                table: "GameSessionRecords",
                column: "QuizId",
                unique: true,
                filter: "\"EndedAtUtc\" IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GameSessionRecords_QuizId_Active",
                table: "GameSessionRecords");
        }
    }
}
