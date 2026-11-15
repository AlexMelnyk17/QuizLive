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
    }
}