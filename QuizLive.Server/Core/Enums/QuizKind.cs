namespace QuizLive.Server.Core.Enums
{
    public enum QuizKind
    {
        OpenText = 0,   // open question, no correct answer
        PollChoice = 1,   // single choice, no correct answer
        QuizChoice = 2    // single choice, exactly one correct
    }
}
