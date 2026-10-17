namespace QuizLive.Server.Core.Enums
{
    public enum QuizKind
    {
        OpenText = 0,   // відкрите питання, правильної відповіді немає
        PollChoice = 1,   // вибір одного варіанта, правильної відповіді немає
        QuizChoice = 2    // вибір одного варіанта, один правильний
    }
}
