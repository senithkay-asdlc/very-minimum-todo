screen TodoList "A signed-in user's own todos"
  navbar "Todo App"
  heading "Your todos"
  row
    input "New todo title"
    button "Add" primary
    // adds inline and refreshes the list below; no navigation needed
  table "Title | Status | Action"
    row "Buy milk | Pending | Mark done"
    row "Walk the dog | Done | Mark not done"

flow "Manage todos"
  role "User"
  description "A signed-in user adds a todo and toggles it done or not-done"
  TodoList
