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
        [HttpGet]
        public async Task<ActionResult<List<QuizDto>>> GetAll()
        {
            return await quizService.GetMyQuizzesAsync();
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<QuizDto>> GetById(int id)
        {
            return await quizService.GetByIdAsync(id);
        }
    }
}
