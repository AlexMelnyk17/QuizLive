using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Quizzes;

namespace QuizLive.Server.API.Controllers
{
    /// <summary>
    /// CRUD and archiving of quizzes owned by the authenticated user.
    /// </summary>
    [ApiController]
    [Route("api/quizzes")]
    [Authorize]
    [ProducesErrorResponseType(typeof(ProblemDetails))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public class QuizzesController(IQuizService quizService) : ControllerBase
    {
        /// <summary>Returns the current user's quizzes, newest first.</summary>
        /// <param name="archived">
        /// <c>true</c> — only archived, <c>false</c> — only active, omitted — all quizzes.
        /// </param>
        /// <response code="200">The list of quizzes.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        [HttpGet]
        [ProducesResponseType<List<QuizDto>>(StatusCodes.Status200OK)]
        public async Task<ActionResult<List<QuizDto>>> GetAll([FromQuery] bool? archived)
        {
            return await quizService.GetMyQuizzesAsync(archived);
        }

        /// <summary>Returns a quiz of the current user by id.</summary>
        /// <response code="200">The quiz.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The quiz does not exist or belongs to another user.</response>
        [HttpGet("{id:int}")]
        [ProducesResponseType<QuizDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<QuizDto>> GetById(int id)
        {
            return await quizService.GetByIdAsync(id);
        }

        /// <summary>Creates a quiz owned by the current user.</summary>
        /// <response code="201">The quiz was created; <c>Location</c> points to it.</response>
        /// <response code="400">The request body failed validation.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        [HttpPost]
        [ProducesResponseType<QuizDto>(StatusCodes.Status201Created)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<QuizDto>> Create(CreateQuizRequest request)
        {
            var quiz = await quizService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = quiz.Id }, quiz);
        }

        /// <summary>Updates the title and description of a quiz. The kind cannot be changed.</summary>
        /// <response code="200">The updated quiz.</response>
        /// <response code="400">The request body failed validation.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The quiz does not exist or belongs to another user.</response>
        [HttpPut("{id:int}")]
        [ProducesResponseType<QuizDto>(StatusCodes.Status200OK)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<QuizDto>> Update(int id, UpdateQuizRequest request)
        {
            return await quizService.UpdateAsync(id, request);
        }

        /// <summary>Archives a quiz. Archiving an already archived quiz is a no-op.</summary>
        /// <response code="204">The quiz is archived.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The quiz does not exist or belongs to another user.</response>
        [HttpPost("{id:int}/archive")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Archive(int id)
        {
            await quizService.SetArchivedAsync(id, true);
            return NoContent();
        }

        /// <summary>Restores an archived quiz. Unarchiving an active quiz is a no-op.</summary>
        /// <response code="204">The quiz is active.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The quiz does not exist or belongs to another user.</response>
        [HttpPost("{id:int}/unarchive")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Unarchive(int id)
        {
            await quizService.SetArchivedAsync(id, false);
            return NoContent();
        }

        /// <summary>Deletes a quiz together with its questions and options.</summary>
        /// <response code="204">The quiz was deleted.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The quiz does not exist or belongs to another user.</response>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            await quizService.DeleteAsync(id);
            return NoContent();
        }
    }
}
