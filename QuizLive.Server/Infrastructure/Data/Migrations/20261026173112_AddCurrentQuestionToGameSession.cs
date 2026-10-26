using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuizLive.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrentQuestionToGameSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CurrentQuestionEndsAtUtc",
                table: "GameSessionRecords",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CurrentQuestionOrder",
                table: "GameSessionRecords",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CurrentQuestionStartedAtUtc",
                table: "GameSessionRecords",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_GameSessionRecords_CurrentQuestion",
                table: "GameSessionRecords",
                sql: "(\"Status\" = 'Lobby' AND \"CurrentQuestionOrder\" IS NULL AND \"CurrentQuestionStartedAtUtc\" IS NULL AND \"CurrentQuestionEndsAtUtc\" IS NULL) OR (\"Status\" = 'Question' AND \"CurrentQuestionOrder\" IS NOT NULL AND \"CurrentQuestionStartedAtUtc\" IS NOT NULL) OR \"Status\" IN ('Results','Finished')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_GameSessionRecords_CurrentQuestion",
                table: "GameSessionRecords");

            migrationBuilder.DropColumn(
                name: "CurrentQuestionEndsAtUtc",
                table: "GameSessionRecords");

            migrationBuilder.DropColumn(
                name: "CurrentQuestionOrder",
                table: "GameSessionRecords");

            migrationBuilder.DropColumn(
                name: "CurrentQuestionStartedAtUtc",
                table: "GameSessionRecords");
        }
    }
}
