# QuizLive

## Prerequisites

- **Visual Studio 2022** with the “ASP.NET and web development” workload. [Install Visual Studio](https://visualstudio.microsoft.com/)
- **Node.js** 20.19+ or 22.12+ (LTS recommended). [Install Node.js](https://nodejs.org/en/download)

## 1. Clone the repository

```bash
git clone <repository-url>
cd QuizLive
```

## 2. Install dependencies

At the repository root (Git hooks):

```bash
npm install
```

For the frontend:

```bash
cd QuizLive.Client
npm install
```

After `npm install` in `QuizLive.Client`, a `node_modules` folder should appear there.

Create file appsettings.Local.json in QuizLive.Server folder with the following content:

```json
{
  "Jwt": {
    "Key": "{private-key}"
  }
}
```

ptivate-key should be a random string of at least 32 characters. Not recommend to use special characters in the key.

## 3. Run the project

1. Open `QuizLive.sln` in Visual Studio 2022.
2. Set **QuizLive.Server** as the startup project.
3. Press **F5** or **Play**.

In development, the ASP.NET SPA proxy can start the Vite dev server (`npm run dev` in `QuizLive.Client`). See [QuizLive.Client/README.md](QuizLive.Client/README.md) for frontend scripts and tooling.


## 4. Seed demo data

At the repository root:

```bash
dotnet run --project QuizLive.Server -- db seed
```

The command applies pending migrations, then creates the demo user and one demo quiz per quiz kind (open text, poll, scored quiz). It does not start the web server.

Demo login: **quizzer** / **quiz123**.

Seeding is safe to run again: the user and quizzes that already exist (matched by user name and by quiz title) are skipped, not updated.

To seed a different database, pass a config override after `db seed`:

```bash
dotnet run --project QuizLive.Server -- db seed "--ConnectionStrings:Default=Data Source=other.db"
```

### Large stats demo (`seed-stats`)

Creates **12 extra quizzes** (4 per kind, titles prefixed `[Stats demo]`) for user **quizzer**, each with **14–21 finished games**, **5–15 players**, and randomized answers. Safe to run once per database (skips if stats demo quizzes already exist). Creates **quizzer** if missing.

```bash
dotnet run --project QuizLive.Server -- db seed-stats
```

Run `db seed` first if you also want the original three Ukrainian demo quizzes.
## 5. Test coverage

Coverage shows which code the tests actually run. It does not tell whether the tests check the right things, and there are no thresholds yet.

At the repository root:

```bash
npm run coverage:server   # server tests (xUnit) with coverlet, report by ReportGenerator
npm run coverage:client   # client tests (Vitest), summary by ReportGenerator
```

The server command needs the .NET SDK (`dotnet tool restore` is run for you). The client command needs `npm install` in `QuizLive.Client` first. To run only the client tests with coverage: `npm run test:coverage` in `QuizLive.Client`.

| Reports | Server (`coverage/server/report/`) | Client (`QuizLive.Client/coverage/`) |
| ------- | ---------------------------------- | ------------------------------------ |
| HTML (open `index.html`) | yes | yes |
| Cobertura XML | `Cobertura.xml` | `cobertura-coverage.xml` |
| Markdown summary | `SummaryGithub.md` | `summary/SummaryGithub.md` |

Generated EF migrations are excluded from the server numbers (see `QuizLive.Server.Tests/coverlet.runsettings`). Report folders are git-ignored.

`.github/workflows/coverage.yml` runs both commands on pull requests targeting `dev` or `main`, pushes to those branches, and manual dispatch. The workflow remains named **Coverage**. It adds summaries to the job page and uploads report folders as the `coverage-server` and `coverage-client` artifacts.

The client job also checks Prettier formatting, ESLint and TypeScript, then builds production assets with `VITE_API_BASE_URL=/api`. The server job publishes in Release mode with `BuildClientAssets=false`, which skips the SPA project reference because the client is validated independently. This server publish check is not a combined deployment package. Both jobs pin their runtimes and have execution timeouts. Coverage commands target the server test project and client test suite directly.


## 6. Live game protocol

See [the live-game contract](docs/live-game.md) for answers, scoring, results, timer and presence events, reconnect state, and client integration.
