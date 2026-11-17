using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Stats;

namespace QuizLive.Server.API.Controllers
{
    /// <summary>
    /// Activity totals and breakdowns for the authenticated host (no quiz or game lists).
    /// </summary>
    [ApiController]
    [Route("api/stats")]
    [Authorize]
    [ProducesErrorResponseType(typeof(ProblemDetails))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public class StatsController(IStatsService statsService) : ControllerBase
    {
        /// <summary>Returns activity totals and breakdowns for the current host.</summary>
        /// <response code="200">Aggregated statistics.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        [HttpGet]
        [ProducesResponseType<HostStatsDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<HostStatsDto>> Get()
        {
            return await statsService.GetMyStatsAsync();
        }

        /// <summary>Historical play statistics for one owned quiz (finished runs and question breakdowns).</summary>
        /// <response code="200">Quiz play statistics.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The quiz does not exist or belongs to another user.</response>
        [HttpGet("quizzes/{quizId:int}")]
        [ProducesResponseType<QuizPlayStatsDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<QuizPlayStatsDto>> GetQuiz(int quizId)
        {
            return await statsService.GetQuizStatsAsync(quizId);
        }

        /// <summary>Detailed statistics for one finished game hosted by the current user.</summary>
        /// <response code="200">Game play statistics.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The game does not exist or is hosted by another user.</response>
        /// <response code="409">The game has not finished yet.</response>
        [HttpGet("games/{gameId:int}")]
        [ProducesResponseType<GamePlayStatsDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<GamePlayStatsDto>> GetGame(int gameId)
        {
            return await statsService.GetGameStatsAsync(gameId);
        }
    }
}