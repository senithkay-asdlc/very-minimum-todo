import ballerina/os;

// The todo-db platform-resource's wiring (specs/design/components/todo-api/design.json).
// Every value is read from the env var the wiring names, once, here.
configurable string dbHost = os:getEnv("TODO_DB_HOST");
configurable string dbPort = os:getEnv("TODO_DB_PORT");
configurable string dbName = os:getEnv("TODO_DB_DBNAME");
configurable string dbUser = os:getEnv("TODO_DB_USER");
configurable string dbPassword = os:getEnv("TODO_DB_PASSWORD");
