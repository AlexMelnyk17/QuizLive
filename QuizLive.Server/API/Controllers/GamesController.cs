using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Games;

namespace QuizLive.Server.API.Controllers
{
    /// <summary>
    /// Game lobbies: the host creates a game and gets a join code; players join anonymously by code.
    /// </summary>
    [ApiController]
    [Route("api/games")]
    [Authorize]
    [ProducesErrorResponseType(typeof(ProblemDetails))]
    public class GamesController(IGameService gameService) : ControllerBase
    {
        /// <summary>Creates a game in the lobby state for a quiz of the current user.</summary>
        /// <response code="201">The game was created; <c>Location</c> points to it.</response>
        /// <response code="400">The request body failed validation.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The quiz does not exist or belongs to another user.</response>
        /// <response code="409">The quiz is archived or has no questions.</response>
        [HttpPost]
        [ProducesResponseType<GameDto>(StatusCodes.Status201Created)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<GameDto>> Create(CreateGameRequest request)
        {
            var game = await gameService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = game.Id }, game);
        }

        /// <summary>Returns a game hosted by the current user, with the players who joined it.</summary>
        /// <response code="200">The game.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The game does not exist or is hosted by another user.</response>
        [HttpGet("{id:int}")]
        [ProducesResponseType<GameDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<GameDto>> GetById(int id)
        {
            return await gameService.GetByIdAsync(id);
        }

        /// <summary>Ends a game and frees its code. Ending an already ended game is a no-op.</summary>
        /// <response code="204">The game is ended.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The game does not exist or is hosted by another user.</response>
        [HttpPost("{id:int}/end")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> End(int id)
        {
            await gameService.EndAsync(id);
            return NoContent();
        }

        /// <summary>Finds an active game by its 6-digit join code.</summary>
        /// <response code="200">The game.</response>
        /// <response code="404">There is no active game with this code.</response>
        [HttpGet("code/{code}")]
        [AllowAnonymous]
        [ProducesResponseType<GameLookupDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<GameLookupDto>> GetByCode(string code)
        {
            return await gameService.GetByCodeAsync(code);
        }

        /// <summary>Joins a game in the lobby as an anonymous player.</summary>
        /// <remarks>The returned token identifies the player; it is shown only once.</remarks>
        /// <response code="201">The player joined the game.</response>
        /// <response code="400">The request body failed validation.</response>
        /// <response code="404">There is no active game with this code.</response>
        /// <response code="409">The game has already started or the nickname is taken.</response>
        [HttpPost("code/{code}/players")]
        [AllowAnonymous]
        [ProducesResponseType<JoinGameResponse>(StatusCodes.Status201Created)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<JoinGameResponse>> Join(string code, JoinGameRequest request)
        {
            var player = await gameService.JoinAsync(code, request);
            return StatusCode(StatusCodes.Status201Created, player);
        }
    }
}
