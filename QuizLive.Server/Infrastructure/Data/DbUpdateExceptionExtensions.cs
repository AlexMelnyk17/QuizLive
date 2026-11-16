using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace QuizLive.Server.Infrastructure.Data
{
    public static class DbUpdateExceptionExtensions
    {
        // SQLITE_CONSTRAINT_UNIQUE
        private const int SqliteUniqueViolation = 2067;

        public static bool IsUniqueViolation(this DbUpdateException ex) =>
            ex.InnerException is SqliteException { SqliteExtendedErrorCode: SqliteUniqueViolation };
    }
}
