using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Quizzes;

namespace QuizLive.Server.API.Controllers
{
    [ApiController]
    [Route("api/quizzes")]
		[Authorize]	
    public class QuizzesController(IQuizService quizService) : ControllerBase
    {
        // ?archived=true — лише архівні, ?archived=false — лише активні, без параметра — всі.
        [HttpGet]
        public async Task<ActionResult<List<QuizDto>>> GetAll([FromQuery] bool? archived)
        {
            return await quizService.GetMyQuizzesAsync(archived);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<QuizDto>> GetById(int id)
        {
            return await quizService.GetByIdAsync(id);
        }

        [HttpPost]
        public async Task<ActionResult<QuizDto>> Create(CreateQuizRequest request)
        {
            var quiz = await quizService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = quiz.Id }, quiz);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<QuizDto>> Update(int id, UpdateQuizRequest request)
        {
            return await quizService.UpdateAsync(id, request);
        }

        [HttpPost("{id:int}/archive")]
        public async Task<IActionResult> Archive(int id)
        {
            await quizService.SetArchivedAsync(id, true);
            return NoContent();
        }

        [HttpPost("{id:int}/unarchive")]
        public async Task<IActionResult> Unarchive(int id)
        {
            await quizService.SetArchivedAsync(id, false);
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            await quizService.DeleteAsync(id);
            return NoContent();
        }
    }
}
