using QuizLive.Server.Application.Games;

namespace QuizLive.Server.Tests.Games
{
    public class GameCodeGeneratorTests
    {
        [Fact]
        public void Generate_ReturnsSixDigits()
        {
            for (var i = 0; i < 1000; i++)
            {
                Assert.Matches("^[0-9]{6}$", GameCodeGenerator.Generate());
            }
        }
    }
}
