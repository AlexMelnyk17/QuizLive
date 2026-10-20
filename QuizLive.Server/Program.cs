using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Commands;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Infrastructure.Auth;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Infrastructure.ErrorHandling;

namespace QuizLive.Server
{
    public class Program
    {
        public static async Task<int> Main(string[] args)
        {
            if (DbCommandHost.IsDbCommand(args))
            {
                return await DbCommandHost.RunAsync(args);
            }

            var builder = WebApplication.CreateBuilder(args);

						builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

						builder.Services.AddQuizLiveDbContext(builder.Configuration);
						builder.Services.AddQuizLiveAuth(builder.Configuration);
						builder.Services.AddScoped<IQuizService, QuizService>();
						builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                // Кнопка Authorize: токен з POST /api/auth/login додається до кожного запиту.
                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    Description = "JWT token from POST /api/auth/login (without the \"Bearer\" prefix)."
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            builder.Services.AddProblemDetails();
            builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

            var app = builder.Build();

            app.UseExceptionHandler();
            app.UseStatusCodePages();

            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.MigrateAsync();
            }

            app.UseDefaultFiles();
            app.UseStaticFiles();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

						app.UseAuthentication();
						app.UseAuthorization();

            app.MapControllers();

            app.MapFallbackToFile("/index.html");

            await app.RunAsync();
            return 0;
        }
    }
}
