import { css } from "../../styled-system/css";
import React, { useState } from "react";

export function TodoList({ initialTodoItems }: { initialTodoItems: { text: string }[] }) {
  const [todoItems, setTodoItems] = useState(initialTodoItems);
  const [newTodo, setNewTodo] = useState("");
  return (
    <>
      <ul>
        {todoItems.map((todoItem, index) => (
          // biome-ignore lint:
          <li key={index}>{todoItem.text}</li>
        ))}
      </ul>
      <div>
        <form
          onSubmit={async (ev) => {
            ev.preventDefault();

            // Optimistic UI update
            setTodoItems((prev) => [...prev, { text: newTodo }]);
          }}
        >
          <input
            type="text"
            onChange={(ev) => setNewTodo(ev.target.value)}
            value={newTodo}
            className={css({
              p: 2,
              bg: "gray.50",
              borderWidth: 1,
              borderColor: "gray.300",
              color: "gray.900",
              fontSize: "sm",
              rounded: "md",
              width: { base: "full", sm: "auto" },
              _focus: { ringColor: "teal.500", borderColor: "teal.500" },
              mr: 1,
              mb: 1,
            })}
          />
          <button
            type="submit"
            className={css({
              color: "white",
              bg: { base: "teal.700", _hover: "teal.800" },
              _focus: {
                ringWidth: 2,
                ringColor: "teal.300",
                outline: "1px solid transparent",
                outlineOffset: "1px",
              },
              cursor: "pointer",
              fontSize: "sm",
              fontWeight: 500,
              rounded: "md",
              width: { base: "full", sm: "auto" },
              p: 2,
            })}
          >
            Add to-do
          </button>
        </form>
      </div>
    </>
  );
}
