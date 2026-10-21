using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Auth;

namespace QuizLive.Server.API.Controllers
{
		/// <summary>
		/// Registration, login and the current user's profile.
		/// </summary>
		[ApiController]
    [Route("api/auth")]
		[ProducesErrorResponseType(typeof(ProblemDetails))]
	public class AuthController(IAuthService authService) : ControllerBase
    {

				/// <summary>Registers a new host and returns a JWT token.</summary>
				/// <response code="201">The user was created.</response>
				/// <response code="400">The user name or password is invalid.</response>
				/// <response code="409">The user name is already taken.</response>
				[HttpPost("register")]
				[AllowAnonymous]
				[ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
				[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
				[ProducesResponseType(StatusCodes.Status409Conflict)]
				public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
				{
							var response = await authService.RegisterAsync(request);
							return StatusCode(StatusCodes.Status201Created, response);
				}

				/// <summary>Logs in by user name and password and returns a JWT token.</summary>
				/// <response code="200">Login succeeded.</response>
				/// <response code="400">The request body failed validation.</response>
				/// <response code="401">Invalid credentials or the account is temporarily locked.</response>
				[HttpPost("login")]
        [AllowAnonymous]
				[ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
				[ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
				[ProducesResponseType(StatusCodes.Status401Unauthorized)]
				public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            return await authService.LoginAsync(request);
        }

				/// <summary>Returns the profile of the authenticated user.</summary>
				/// <response code="200">The current user.</response>
				/// <response code="401">The token is missing, invalid or expired.</response>
				[HttpGet("me")]
				[Authorize]
				[ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
				[ProducesResponseType(StatusCodes.Status401Unauthorized)]
				public async Task<ActionResult<UserDto>> Me()
        {
            return await authService.GetCurrentUserAsync();
        }
    }
}
