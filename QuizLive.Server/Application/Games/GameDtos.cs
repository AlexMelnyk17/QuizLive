using System.ComponentModel.DataAnnotations;
using QuizLive.Server.Core.Enums;

namespace QuizLive.Server.Application.Games
{
    public record CreateGameRequest(
        [Range(1, int.MaxValue)] int QuizId);

    public record JoinGameRequest(
        [Required, StringLength(40)] string Nickname);

    // Host view of a game. Player tokens are never included.
    public record GameDto(
        int Id,
        string Code,
        int QuizId,
        string QuizTitle,
        QuizKind QuizKind,
        GameStatus Status,
        DateTime CreatedAtUtc,
        DateTime? EndedAtUtc,
        List<GamePlayerDto> Players);

    // A game in the host's list: the player count instead of the players.
    public record GameSummaryDto(
        int Id,
        string Code,
        int QuizId,
        string QuizTitle,
        QuizKind QuizKind,
        GameStatus Status,
        DateTime CreatedAtUtc,
        DateTime? EndedAtUtc,
        int PlayerCount);

    public record GamePlayerDto(
        int Id,
        string Nickname,
        DateTime JoinedAtUtc);

    // Public info by code: what a player sees before entering a nickname.
    public record GameLookupDto(
        string Code,
        string QuizTitle,
        GameStatus Status);

    // What a player gets after connecting to the hub: the lobby as they see it.
    public record PlayerGameStateDto(
        int GameId,
        string Code,
        string QuizTitle,
        GameStatus Status,
        int PlayerId,
        string Nickname,
        List<GamePlayerDto> Players);

    // The token is returned only once, on join; the client keeps it to connect to the game later.
    public record JoinGameResponse(
        int GameId,
        int PlayerId,
        string Nickname,
        string Token);
}
