import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

// The largest page a caller may ask for; a request over this is clamped down
// to it rather than rejected — the contract names no 400 for this operation.
const int MAX_PAGE_LIMIT = 100;
const int DEFAULT_PAGE_LIMIT = 20;

// A todos row, column-aliased to camelCase in every query so the record field
// names are the exact source keys `queryRow`/`query` bind against.
type TodoRow record {|
    string id;
    string userId;
    string title;
    boolean done;
    time:Utc createdAt;
|};

type CountRow record {|
    int count;
|};

function toTodo(TodoRow row) returns Todo => {
    id: row.id,
    title: row.title,
    done: row.done,
    createdAt: time:utcToString(row.createdAt)
};

function clampLimit(int requested) returns int {
    if requested < 1 {
        return DEFAULT_PAGE_LIMIT;
    }
    if requested > MAX_PAGE_LIMIT {
        return MAX_PAGE_LIMIT;
    }
    return requested;
}

function clampOffset(int requested) returns int {
    if requested < 0 {
        return 0;
    }
    return requested;
}

function pageUri(int pageLimit, int pageOffset) returns string =>
    string `/me/todos?limit=${pageLimit}&offset=${pageOffset}`;

// GET /me/todos — the caller's own rows, resolved through the gateway
// assertion's `sub` and nothing the client sent.
function listTodosForCaller(string userId, int requestedLimit, int requestedOffset) returns TodoList|error {
    int pageLimit = clampLimit(requestedLimit);
    int pageOffset = clampOffset(requestedOffset);

    CountRow countRow = check todoDbClient->queryRow(`
        SELECT COUNT(*) AS "count" FROM todos WHERE user_id = ${userId}
    `);
    int total = countRow.count;

    stream<TodoRow, sql:Error?> rowStream = todoDbClient->query(`
        SELECT id, user_id AS "userId", title, done, created_at AS "createdAt"
        FROM todos
        WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC
        LIMIT ${pageLimit} OFFSET ${pageOffset}
    `);
    Todo[] todos = [];
    check from TodoRow row in rowStream
        do {
            todos.push(toTodo(row));
        };

    string? next = pageOffset + pageLimit < total ? pageUri(pageLimit, pageOffset + pageLimit) : ();
    string? previous = pageOffset > 0 ? pageUri(pageLimit, clampOffset(pageOffset - pageLimit)) : ();

    TodoList result = {
        count: total,
        next: next,
        previous: previous,
        data: todos
    };
    return result;
}

// POST /me/todos — stamps the caller's own id on the new row; never the
// client's.
function createTodoForCaller(string userId, string title) returns Todo|error {
    string id = uuid:createRandomUuid();
    time:Utc createdAt = time:utcNow();
    sql:ExecutionResult _ = check todoDbClient->execute(`
        INSERT INTO todos (id, user_id, title, done, created_at)
        VALUES (${id}, ${userId}, ${title}, false, ${createdAt})
    `);
    return {
        id: id,
        title: title,
        done: false,
        createdAt: time:utcToString(createdAt)
    };
}

// PATCH /me/todos/{todoId} — both the id and the owner filter in one query;
// a row that exists but is not the caller's matches nothing here, same as a
// row that does not exist at all, so `sql:NoRowsError` is the single 404 case.
function updateTodoForCaller(string userId, string todoId, boolean done) returns Todo|error? {
    TodoRow|error row = todoDbClient->queryRow(`
        UPDATE todos
        SET done = ${done}
        WHERE id = ${todoId} AND user_id = ${userId}
        RETURNING id, user_id AS "userId", title, done, created_at AS "createdAt"
    `);
    if row is sql:NoRowsError {
        return ();
    }
    if row is error {
        return row;
    }
    return toTodo(row);
}
