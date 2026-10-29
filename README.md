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

