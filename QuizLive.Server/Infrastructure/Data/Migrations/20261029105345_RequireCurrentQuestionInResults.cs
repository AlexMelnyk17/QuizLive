using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizLive.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class RequireCurrentQuestionInResults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_GameSessionRecords_CurrentQuestion",
                table: "GameSessionRecords");

            migrationBuilder.AddCheckConstraint(
                name: "CK_GameSessionRecords_CurrentQuestion",
                table: "GameSessionRecords",
                sql: "(\"Status\" = 'Lobby' AND \"CurrentQuestionOrder\" IS NULL AND \"CurrentQuestionStartedAtUtc\" IS NULL AND \"CurrentQuestionEndsAtUtc\" IS NULL) OR (\"Status\" IN ('Question','Results') AND \"CurrentQuestionOrder\" IS NOT NULL AND \"CurrentQuestionStartedAtUtc\" IS NOT NULL) OR \"Status\" = 'Finished'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_GameSessionRecords_CurrentQuestion",
                table: "GameSessionRecords");

            migrationBuilder.AddCheckConstraint(
                name: "CK_GameSessionRecords_CurrentQuestion",
                table: "GameSessionRecords",
                sql: "(\"Status\" = 'Lobby' AND \"CurrentQuestionOrder\" IS NULL AND \"CurrentQuestionStartedAtUtc\" IS NULL AND \"CurrentQuestionEndsAtUtc\" IS NULL) OR (\"Status\" = 'Question' AND \"CurrentQuestionOrder\" IS NOT NULL AND \"CurrentQuestionStartedAtUtc\" IS NOT NULL) OR \"Status\" IN ('Results','Finished')");
        }
    }
}
