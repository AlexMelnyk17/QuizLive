using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using QuizLive.Server.API.Hubs;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Commands;
using QuizLive.Server.Application.Games;
using QuizLive.Server.Application.Questions;
using QuizLive.Server.Application.Quizzes;
using QuizLive.Server.Application.Stats;
using QuizLive.Server.Infrastructure.Auth;
using QuizLive.Server.Infrastructure.Data;
using QuizLive.Server.Infrastructure.ErrorHandling;
using QuizLive.Server.Infrastructure.Games;
using QuizLive.Server.Infrastructure.Realtime;
using System.Reflection;

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
			builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
				

            builder.Services.AddProblemDetails();
            builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
            builder.Services.AddScoped<IQuizService, QuizService>();
            builder.Services.AddScoped<IQuestionService, QuestionService>();
            builder.Services.AddScoped<IGameService, GameService>();
            builder.Services.AddScoped<IGameFlowService, GameFlowService>();
            builder.Services.AddScoped<IStatsService, StatsService>();
            builder.Services.AddSingleton(TimeProvider.System);
            builder.Services.AddHostedService<QuestionDeadlineService>();
            builder.Services.AddSignalR(options => options.AddFilter<HubExceptionFilter>());
            builder.Services.AddSingleton<IGameNotifier, SignalRGameNotifier>();

            builder.Services.AddSwaggerGen(options =>
						{
							var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
							options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFile));

							options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
							{
								Type = SecuritySchemeType.Http,
								Scheme = "bearer",
								BearerFormat = "JWT",
								In = ParameterLocation.Header,
								Description = "Paste the JWT token returned by /api/auth/login."
							});

							options.AddSecurityRequirement(new OpenApiSecurityRequirement
							{
									{
											new OpenApiSecurityScheme
											{
													Reference = new OpenApiReference
													{
														Type = ReferenceType.SecurityScheme,
														Id = "Bearer"
													}
											},
											Array.Empty<string>()
									}
							});
						});

						var app = builder.Build();

            app.UseExceptionHandler();
            app.UseStatusCodePages();

            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.MigrateAsync();
            }

            app.UseDefaultFiles();
            app.UseStaticFiles(new StaticFileOptions
            {
                OnPrepareResponse = ConfigureStaticAssetCache
            });

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

			app.UseAuthentication();
			app.UseAuthorization();

            app.MapControllers();
            app.MapHub<GameHub>(HubRoutes.Game);

            app.MapFallbackToFile("/index.html", new StaticFileOptions
            {
                OnPrepareResponse = ConfigureHtmlCache
            });

            await app.RunAsync();
            return 0;
        }

        private const string HashedAssetPathPrefix = "/assets";
        private const string HashedAssetCacheControl = "public, max-age=31536000, immutable";
        private const string HtmlCacheControl = "no-cache";
        private const string HtmlFileName = "index.html";

        private static void ConfigureStaticAssetCache(StaticFileResponseContext context)
        {
            if (context.Context.Request.Path.StartsWithSegments(HashedAssetPathPrefix))
            {
                context.Context.Response.Headers.CacheControl = HashedAssetCacheControl;
                return;
            }

            if (string.Equals(context.File.Name, HtmlFileName, StringComparison.OrdinalIgnoreCase))
            {
                ConfigureHtmlCache(context);
            }
        }

        private static void ConfigureHtmlCache(StaticFileResponseContext context)
        {
            context.Context.Response.Headers.CacheControl = HtmlCacheControl;
        }
    }
}
