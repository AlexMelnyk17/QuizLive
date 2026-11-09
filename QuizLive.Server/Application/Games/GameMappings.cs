using System.Linq.Expressions;
using QuizLive.Server.Core.Entities.Games;

namespace QuizLive.Server.Application.Games
{
    public static class GameMappings
    {
        public static readonly Expression<Func<GameSessionRecord, GameDto>> ToDto = game => new GameDto(
            game.Id,
            game.Code,
            game.QuizId,
            game.Quiz.Title,
            game.Quiz.Kind,
            game.Status,
            game.CreatedAtUtc,
            game.EndedAtUtc,
            game.Players
                .OrderBy(p => p.JoinedAtUtc)
                .Select(p => new GamePlayerDto(p.Id, p.Nickname, p.JoinedAtUtc))
                .ToList());
    }
}
