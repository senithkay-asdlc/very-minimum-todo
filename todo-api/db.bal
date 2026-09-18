import ballerina/sql;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// The default port a bare `TODO_DB_PORT` (unset, or unparsable) falls back to —
// the service still starts; only a real connection attempt can fail.
const int DEFAULT_DB_PORT = 5432;

function resolvedDbPort() returns int {
    int|error parsed = int:fromString(dbPort);
    if parsed is int {
        return parsed;
    }
    return DEFAULT_DB_PORT;
}

final postgresql:Client todoDbClient = check new (
    host = dbHost,
    username = dbUser,
    password = dbPassword,
    database = dbName,
    port = resolvedDbPort()
);

// Runs before any listener starts, so a table the DB does not yet have fails
// the service fast rather than 500ing the first request.
final () dbReady = check initTodosTable();

function initTodosTable() returns error? {
    sql:ExecutionResult _ = check todoDbClient->execute(`
        CREATE TABLE IF NOT EXISTS todos (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            done BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
}
