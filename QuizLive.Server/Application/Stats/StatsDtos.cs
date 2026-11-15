namespace QuizLive.Server.Application.Stats
{
    public record HostStatsDto(
        QuizStatsDto Quizzes,
        QuestionStatsDto Questions,
        GameStatsDto Games,
        PlayerStatsDto Players,
        ActivityStatsDto Activity);

    public record QuizStatsDto(int Total, int Archived, KindCountsDto ByKind);

    public record KindCountsDto(int OpenText, int PollChoice, int QuizChoice);

    public record QuestionStatsDto(int Total, decimal AveragePerQuiz);

    public record GameStatsDto(
        int Total,
        int Finished,
        StatusCountsDto ByStatus,
        KindCountsDto ByKind);

    public record StatusCountsDto(int Lobby, int Question, int Results, int Finished);

    public record PlayerStatsDto(int TotalJoins, decimal AveragePerGame, int MaxInOneGame);

    public record ActivityStatsDto(
        int GamesLast7Days,
        int GamesLast30Days,
        List<GamesPerDayDto> GamesPerDay);

    public record GamesPerDayDto(DateOnly Date, int Count);
}