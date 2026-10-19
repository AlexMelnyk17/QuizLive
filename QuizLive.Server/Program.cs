using Microsoft.EntityFrameworkCore;
using QuizLive.Server.Application.Abstractions;
using QuizLive.Server.Application.Commands;
using QuizLive.Server.Infrastructure.Auth;
using QuizLive.Server.Infrastructure.Data;

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

            builder.Services.AddQuizLiveDbContext(builder.Configuration);
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

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

            app.UseAuthorization();

            app.MapControllers();

            app.MapFallbackToFile("/index.html");

            await app.RunAsync();
            return 0;
        }
    }
}
