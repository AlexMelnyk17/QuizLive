using Microsoft.AspNetCore.Mvc;
using QuizLive.Server.Data.DTO;
using QuizLive.Server.Services;

namespace QuizLive.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuizzezController(IQuizService service) : ControllerBase
    {
        [HttpGet]
        [ProducesResponseType(typeof(IReadOnlyList<ReadQuizListItemDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(CancellationToken ct) =>
            Ok(await service.GetAllAsync(ct));

        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ReadQuizDetailsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id, CancellationToken ct) =>
            Ok(await service.GetByIdAsync(id, ct));

        [HttpPost]
        [ProducesResponseType(typeof(ReadQuizDetailsDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create(CreateQuizDto dto, CancellationToken ct)
        {
            var created = await service.CreateAsync(dto, ct);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ReadQuizDetailsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, CreateQuizDto dto, CancellationToken ct) =>
            Ok(await service.UpdateAsync(id, dto, ct));

        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Delete(int id, CancellationToken ct)
        {
            await service.DeleteAsync(id, ct);
            return NoContent();
        }
    }
}
