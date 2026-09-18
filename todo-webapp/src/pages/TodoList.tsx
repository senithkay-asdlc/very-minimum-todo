// wireframes.dsl screen TodoList: navbar "Todo App", heading "Your todos", a
// row with an input "New todo title" + primary button "Add", and a table
// "Title | Status | Action" with per-row "Mark done"/"Mark not done".
//
// Every read and write goes through todo-api; this screen holds no data of
// its own beyond the in-memory list it renders. Adding and toggling both
// update the list in place — no navigation, per the wireframe's own comment.

import { useEffect, useState, type JSX } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Form,
  ListingTable,
  PageContent,
  PageTitle,
  TextField,
} from "@wso2/oxygen-ui";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { Can } from "../authz/gates";
import { todoApi } from "../api";
import type { components } from "../generated/todo-api";

type Todo = components["schemas"]["Todo"];

export function TodoListPage(): JSX.Element {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const { data, error } = await todoApi.GET("/me/todos", {});
      if (!live) return;
      if (error) {
        setLoadError("Could not load your todos.");
        return;
      }
      setTodos(data?.data ?? []);
    })();
    return () => {
      live = false;
    };
  }, []);

  async function handleAdd(): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) return;
    setAdding(true);
    setAddError(null);
    const { data, error } = await todoApi.POST("/me/todos", { body: { title: trimmed } });
    setAdding(false);
    if (error || !data) {
      setAddError("Could not add that todo.");
      return;
    }
    const created = data;
    setTodos((current) => [...(current ?? []), created]);
    setTitle("");
  }

  async function handleToggle(todo: Todo): Promise<void> {
    setTogglingId(todo.id);
    const { data, error } = await todoApi.PATCH("/me/todos/{todoId}", {
      params: { path: { todoId: todo.id } },
      body: { done: !todo.done },
    });
    setTogglingId(null);
    if (error || !data) return;
    const updated = data;
    setTodos((current) => (current ?? []).map((t) => (t.id === updated.id ? updated : t)));
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Your todos</PageTitle.Header>
      </PageTitle>

      <Can op="POST /me/todos">
        <Form.Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: "flex-start" }}>
          <TextField
            label="New todo title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            disabled={adding}
          />
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => void handleAdd()}
            disabled={adding || title.trim().length === 0}
          >
            Add
          </Button>
        </Form.Stack>
      </Can>
      {addError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {addError}
        </Alert>
      ) : null}

      {loadError ? (
        <Alert severity="error">{loadError}</Alert>
      ) : todos === null ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Title</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
                <ListingTable.Cell>Action</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {todos.map((todo) => (
                <ListingTable.Row key={todo.id}>
                  <ListingTable.Cell>{todo.title}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip
                      label={todo.done ? "Done" : "Pending"}
                      color={todo.done ? "success" : "default"}
                      size="small"
                    />
                  </ListingTable.Cell>
                  <ListingTable.Cell>
                    <Can op="PATCH /me/todos/{todoId}" fallback={<span>—</span>}>
                      <ListingTable.RowActions>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => void handleToggle(todo)}
                          disabled={togglingId === todo.id}
                        >
                          {todo.done ? "Mark not done" : "Mark done"}
                        </Button>
                      </ListingTable.RowActions>
                    </Can>
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))}
            </ListingTable.Body>
          </ListingTable>
          {todos.length === 0 ? (
            <ListingTable.EmptyState title="No todos yet" description="Add your first todo above." />
          ) : null}
        </ListingTable.Container>
      )}
    </PageContent>
  );
}
