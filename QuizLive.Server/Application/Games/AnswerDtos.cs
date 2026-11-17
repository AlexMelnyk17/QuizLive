using QuizLive.Server.Application.Stats;

namespace QuizLive.Server.Application.Games;

// QuestionNumber prevents an answer queued on a slow connection from targeting the next question.
public record SubmitAnswerRequest(int QuestionNumber, int? OptionId = null, string? Text = null);
public record AnswerProgressDto(int Number, int Answered, int Players);
public record OptionResultDto(int Id, string Text, int Count, bool? IsCorrect);
public record HostQuestionResultsDto(int Number, int Answered, int Players,
    List<OptionResultDto>? Options, List<OpenAnswerFrequencyDto>? OpenAnswers);
public record PlayerQuestionResultsDto(int Number, bool Answered, bool? IsCorrect,
    int Points, int Total, int Place);
public record LeaderboardEntryDto(int PlayerId, string Nickname, int Total, int Place);
public record LeaderboardDto(List<LeaderboardEntryDto> Entries, bool IsFinal);
public record PlayerPresenceDto(int PlayerId, bool IsOnline);

public record QuestionTimeAddedDto(int Number, QuestionTimingDto Timing);
