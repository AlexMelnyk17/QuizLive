# Live game contract

Hub: `/api/hubs/game`. Connect using `ConnectAsHost(gameId)` with a host JWT or
`ConnectAsPlayer(playerToken)`. A connection can join one game once. Host commands
and answers always target that connection's game; clients never supply a player id.

## Answers

`SubmitAnswer({ questionNumber, optionId })` submits a choice.
`SubmitAnswer({ questionNumber, text })` submits open text (trimmed, 1–200 characters).
Only player connections can submit. The question number must match the open question,
the server clock must be strictly before its deadline, and the option must belong to
that question. Untimed questions accept answers until the host closes them.

An answer and its score commit in one transaction. Each existing answer table has a
unique `(PlayerId, QuestionId)` index. While the question is open, a new submission replaces
the player's previous answer in that row. Concurrent submissions are serialized, and the last
accepted revision wins. A revision recalculates the speed bonus at its acceptance time and
adjusts the player's total by the difference; retrying an identical answer preserves its time
and score. Closed or expired questions reject revisions. The question number keeps
an old queued submission from answering a subsequent question.

The host receives `AnswerProgress({ number, answered, players })`. `players` counts
all registered players, including offline players. Reconnect snapshots include
`hasAnswered` and `currentAnswer` (`questionNumber`, `optionId`, `text`, nullable) so the
client restores the player's own saved selection. They never expose other players' individual answers.

## Scoring and results

For a correct scored answer:

`points = BasePoints + floor(BasePoints * 0.5 * remainingFraction)`

`remainingFraction` is the fraction of the server's allowed duration still remaining
when the answer is accepted, clamped to 0–1. An extension increases that duration.
An untimed question has no speed bonus. Incorrect, poll and open-text answers earn
zero. Scores are persisted on answers and accumulated in `Player.TotalScore`.
The migration backfills totals for existing games from their stored answer points.

Closing transitions to Results once, whether the host or timer wins. After that commit:

| Event | Audience | Payload |
| --- | --- | --- |
| `HostResults` | Host tabs | `{ number, answered, players, options, openAnswers }` |
| `PlayerResults` | That player's tabs | `{ number, answered, isCorrect, points, total, place }` |
| `Leaderboard` | Everyone in this game | `{ entries: [{ playerId, nickname, total, place }], isFinal }` |
| `QuestionClosed` | Everyone in this game | Question number (existing contract) |

Host option results have `{ id, text, count, isCorrect }`, including options with no
votes. Poll correctness is null. Open text uses `OpenTextAnswerGrouper` and returns
`[{ text, count }]`, with case/whitespace normalization and hidden answers excluded.
Personal correctness is null for poll/open-text questions and unanswered questions.
Players never receive the host aggregate or another player's personal result.

Equal totals share a competition rank (1, 1, 3); join time and id order ties
deterministically. Every registered player appears, including players with no answer.
At game end, `Leaderboard` with `isFinal: true` precedes the existing `GameEnded()`.
While Results is shown, reconnect snapshots include `results` and `leaderboard`.
Host snapshots also contain `answerProgress`. Results are null while a question is open.
Finished games retain the existing rule that new hub connections cannot join them.

## Timer

`AddTime(seconds)` is a host command. An integer from 1 through 300 extends the
current timed question if it has not expired. It emits
`TimeAdded({ number, timing: { startedAtUtc, endsAtUtc, serverNowUtc } })` to everyone.
The original `QuestionShown`/`HostQuestionShown` shapes remain unchanged.

`LiveGameWorker` checks persisted deadlines as soon as it starts, then every 250 ms. It uses the same
compare-and-set closing transition as `ShowResults`. Its predicate includes the
question number and exact deadline, so an extension invalidates a pending old timer.
Late answers are rejected by the server even between a deadline and the next tick.
Persisted deadlines also recover after a server restart.

## Presence

Snapshots contain `presence: [{ playerId, isOnline }]`. A player's first connection
emits `PlayerPresenceChanged({ playerId, isOnline: true })`; their last disconnect
emits the corresponding false status and `PlayerLeft(playerId)`. Leaving marks a
player offline; it preserves their answers, score and place. Multiple tabs count once.

The last host disconnect starts a 20-second grace period. Any host tab reconnecting
within that period cancels cleanup. Once it expires, an unfinished game is deleted
with its players and answers. An explicitly ended game is preserved. A game with
no connected host (including after a process restart) gets the same grace period
when first observed. Abandoned-game deletion sends `GameEnded()` to remaining players.

Presence is kept in memory for the current single-server SQLite deployment. A
multi-server deployment would require a shared presence registry and SignalR backplane.

## Client integration and verification

`modules/game/schemas.ts`, `gameHubApi.ts`, and `subscribeToGameEvents.ts` expose
these contracts for the live-game screens. Subscribe before starting the connection.
As with existing events, deduplicate snapshots/events by question number and player
id; use `serverNowUtc` to update countdowns after `TimeAdded`.

The Coverage workflow already installs runtime 8 and SDK 9, writes a CI-local
`global.json` pinning SDK 9, runs server tests, and publishes a Release server build.
Locally, with SDK 9:

```powershell
dotnet test QuizLive.Server.Tests/QuizLive.Server.Tests.csproj --property:BuildClientAssets=false
npm --prefix QuizLive.Client run verify
```

Server tests cover all three full games over real SignalR connections, answers and
final leaderboards, duplicate/close races, private delivery, reconnect results,
deadline extensions and host/player presence. Timer/presence boundary tests inject
`TimeProvider` and drive the production worker tick without waiting 20 real seconds.
