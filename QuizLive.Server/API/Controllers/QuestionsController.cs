using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Questions;

namespace QuizLive.Server.API.Controllers
{
    /// <summary>
    /// Questions of a quiz owned by the authenticated user (author view, includes correct answers).
    /// </summary>
    [ApiController]
    [Route("api/quizzes/{quizId:int}/questions")]
    [Authorize]
    [ProducesErrorResponseType(typeof(ProblemDetails))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public class QuestionsController(IQuestionService questionService) : ControllerBase
    {
        /// <summary>Returns all questions of the quiz ordered by <c>order</c>.</summary>
        /// <response code="200">The list of questions.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The quiz does not exist or belongs to another user.</response>
        [HttpGet]
        [ProducesResponseType<List<QuestionDto>>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<List<QuestionDto>>> GetAll(int quizId)
        {
            return await questionService.GetAllAsync(quizId);
        }

        /// <summary>Returns a question of the quiz by id.</summary>
        /// <response code="200">The question.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The quiz or the question does not exist, or the quiz belongs to another user.</response>
        [HttpGet("{questionId:int}")]
        [ProducesResponseType<QuestionDto>(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<QuestionDto>> GetById(int quizId, int questionId)
        {
            return await questionService.GetByIdAsync(quizId, questionId);
        }

        /// <summary>Adds a question to the end of the quiz.</summary>
        /// <remarks>
        /// The question type is taken from the quiz kind, so the body has no <c>kind</c> field.
        /// Which fields are allowed depends on that kind; a field that is not allowed must be omitted or <c>null</c>.
        ///
        /// <para><b>All kinds</b></para>
        /// - <c>text</c> — required, 1–1000 characters.
        /// - <c>timeLimitSeconds</c> — optional, 5–300.
        /// - <c>imageUrl</c> — optional, an absolute URL up to 500 characters.
        ///
        /// <para><b>OpenText</b> — participants type a free answer, there is no correct one.</para>
        /// - <c>options</c> — not allowed (omit, <c>null</c> or <c>[]</c>).
        /// - <c>basePoints</c> — not allowed.
        /// <code>
        /// { "text": "What did you like most?", "timeLimitSeconds": 60 }
        /// </code>
        ///
        /// <para><b>PollChoice</b> — participants pick one option, there is no correct one.</para>
        /// - <c>options</c> — required, 2–10 items.
        /// - <c>options[].text</c> — required, 1–300 characters.
        /// - <c>options[].isCorrect</c> — not allowed.
        /// - <c>basePoints</c> — not allowed.
        /// <code>
        /// { "text": "Which day suits you?", "options": [ { "text": "Monday" }, { "text": "Friday" } ] }
        /// </code>
        ///
        /// <para><b>QuizChoice</b> — participants pick one option, exactly one is correct.</para>
        /// - <c>options</c> — required, 2–10 items.
        /// - <c>options[].text</c> — required, 1–300 characters.
        /// - <c>options[].isCorrect</c> — required in every option; exactly one option is <c>true</c>.
        /// - <c>basePoints</c> — optional, 0–10000.
        /// <code>
        /// { "text": "Capital of France?", "basePoints": 1000,
        ///   "options": [ { "text": "Paris", "isCorrect": true }, { "text": "Lyon", "isCorrect": false } ] }
        /// </code>
        ///
        /// Options are ordered as they appear in the array. The question is added after the last one.
        /// </remarks>
        /// <response code="201">The question was created; <c>Location</c> points to it.</response>
        /// <response code="400">The request body failed validation.</response>
        /// <response code="401">The token is missing, invalid or expired.</response>
        /// <response code="404">The quiz does not exist or belongs to another user.</response>
        /// <response code="409">The quiz has an active game, or it was changed by a concurrent request.</response>
        [HttpPost]
        [ProducesResponseType<QuestionDto>(StatusCodes.Status201Created)]
        [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<QuestionDto>> Create(int quizId, CreateQuestionRequest request)
        {
            var question = await questionService.CreateAsync(quizId, request);
            return CreatedAtAction(nameof(GetById), new { quizId, questionId = question.Id }, question);
        }
    }
}
