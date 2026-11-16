using System.Security.Cryptography;

namespace QuizLive.Server.Application.Games
{
    public static class GameCodeGenerator
    {
        public const int Length = 6;

        // Digits only, so the code is easy to type on a phone keypad.
        private const string Alphabet = "0123456789";

        // Cryptographic RNG so codes cannot be predicted.
        public static string Generate() => RandomNumberGenerator.GetString(Alphabet, Length);

        public static string Normalize(string code) => code.Trim();
    }
}
