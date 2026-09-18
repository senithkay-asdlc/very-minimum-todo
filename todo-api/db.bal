import ballerina/lang.runtime;
import ballerina/log;
import ballerina/sql;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// The default port a bare `TODO_DB_PORT` (unset, or unparsable) falls back to —
// the service still starts; only a real connection attempt can fail.
const int DEFAULT_DB_PORT = 5432;

// The todo-db platform resource is a dedicated CloudNativePG cluster
// provisioned alongside this component, and cluster creation is asynchronous:
// on a first deploy this pod can start before the database is reachable. A
// single failed `check` here used to panic module init, which exits the
// container and crash-loops it — the listener never opens, so the deployment
// never becomes ready even after the database comes up. Retry with a bounded
// backoff instead: the process stays up and the listener opens as soon as the
// database answers.
const int MAX_DB_INIT_ATTEMPTS = 30;
const decimal DB_INIT_RETRY_SECONDS = 5;

function resolvedDbPort() returns int {
    int|error parsed = int:fromString(dbPort);
    if parsed is int {
        return parsed;
    }
    return DEFAULT_DB_PORT;
}

// Connects and ensures the schema exists, retrying the whole sequence on
// failure so a database that is still provisioning does not take the
// container down with it.
function connectAndInitDb() returns postgresql:Client|error {
    error? lastError = ();
    foreach int attempt in 1 ... MAX_DB_INIT_ATTEMPTS {
        postgresql:Client|sql:Error dbClient = new (
            host = dbHost,
            username = dbUser,
            password = dbPassword,
            database = dbName,
            port = resolvedDbPort()
        );
        if dbClient is postgresql:Client {
            sql:ExecutionResult|sql:Error created = dbClient->execute(`
                CREATE TABLE IF NOT EXISTS todos (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    done BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            `);
            if created is sql:ExecutionResult {
                return dbClient;
            }
            lastError = created;
            error? closeErr = dbClient.close();
            if closeErr is error {
                log:printWarn("failed to close a todo-db client that could not migrate", 'error = closeErr);
            }
        } else {
            lastError = dbClient;
        }
        log:printWarn(string `todo-db not ready yet (attempt ${attempt}/${MAX_DB_INIT_ATTEMPTS}); retrying in ${DB_INIT_RETRY_SECONDS}s`,
                'error = lastError);
        runtime:sleep(DB_INIT_RETRY_SECONDS);
    }
    return lastError ?: error("todo-db did not become reachable in time");
}

final postgresql:Client todoDbClient = check connectAndInitDb();
