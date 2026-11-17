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

    public record QuizPlayStatsDto(
        int QuizId,
        string QuizTitle,
        Core.Enums.QuizKind Kind,
        int QuestionCount,
        QuizPlayGameStatsDto Games,
        PlayerStatsDto Players,
        ActivityStatsDto Activity,
        List<QuizRunSummaryDto> Runs,
        List<QuizChoiceQuestionStatsDto>? QuizChoiceQuestions,
        List<PollQuestionStatsDto>? PollQuestions,
        List<OpenQuestionStatsDto>? OpenQuestions);

    public record QuizPlayGameStatsDto(
        int Total,
        int Finished,
        DateTime? LastPlayedAtUtc,
        decimal? AverageDurationSeconds);

    public record QuizRunSummaryDto(
        int GameId,
        DateTime CreatedAtUtc,
        DateTime EndedAtUtc,
        decimal DurationSeconds,
        int PlayerCount,
        decimal? AveragePoints,
        decimal? CorrectPercent,
        int? AnswerCount);

    public record QuizChoiceOptionStatsDto(
        int OptionId,
        int Order,
        string Text,
        int Count,
        bool IsCorrect);

    public record QuizChoiceQuestionStatsDto(
        int QuestionId,
        int Order,
        string Text,
        int PlayerAnsweredCount,
        int PossibleAnswers,
        int CorrectCount,
        decimal CorrectPercent,
        decimal? AverageElapsedMs,
        decimal? AveragePoints,
        List<QuizChoiceOptionStatsDto> Options);

    public record PollOptionStatsDto(int OptionId, int Order, string Text, int Count);

    public record PollQuestionStatsDto(
        int QuestionId,
        int Order,
        string Text,
        int PlayerAnsweredCount,
        int PossibleAnswers,
        List<PollOptionStatsDto> Options);

    public record OpenAnswerFrequencyDto(string Text, int Count);

    public record OpenAnswerEntryDto(
        int PlayerId,
        string Nickname,
        string Text,
        bool IsHidden,
        DateTime AnsweredAtUtc);

    public record OpenQuestionStatsDto(
        int QuestionId,
        int Order,
        string Text,
        int PlayerAnsweredCount,
        int PossibleAnswers,
        int AnswerCount,
        int HiddenCount,
        List<OpenAnswerFrequencyDto> Answers,
        int OtherCount,
        List<OpenAnswerEntryDto>? Entries);

    public record GamePlayStatsDto(
        int GameId,
        int QuizId,
        string QuizTitle,
        Core.Enums.QuizKind Kind,
        DateTime CreatedAtUtc,
        DateTime EndedAtUtc,
        decimal DurationSeconds,
        int PlayerCount,
        List<GamePlayerStatsDto> Players,
        List<QuizChoiceQuestionStatsDto>? QuizChoiceQuestions,
        List<PollQuestionStatsDto>? PollQuestions,
        List<OpenQuestionStatsDto>? OpenQuestions);

    public record GamePlayerStatsDto(
        int PlayerId,
        string Nickname,
        DateTime JoinedAtUtc,
        int AnswerCount,
        int? CorrectCount,
        int? TotalPoints);
}