import React, { useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { todosState, memosState } from "@store/atoms";
import { TodoItem, MemoEntry } from "@types";
import { v4 as uuidv4 } from "uuid";
import { formatDate } from "@utils/calendar";
import { MdCheckBox, MdCheckBoxOutlineBlank, MdDelete } from "react-icons/md";
import styles from "./TodoMemo.module.scss";

interface TodoMemoProps {
  date: Date;
}

const TodoMemo: React.FC<TodoMemoProps> = ({ date }) => {
  const [todos, setTodos] = useRecoilState(todosState);
  const [memos, setMemos] = useRecoilState(memosState);
  const [newTodoContent, setNewTodoContent] = useState("");
  const [memoContent, setMemoContent] = useState("");

  // 선택된 날짜의 투두와 메모 가져오기
  const dateTodos = todos.filter(
    (todo) => formatDate(new Date(todo.date)) === formatDate(date)
  );
  const dateMemo = memos.find(
    (memo) => formatDate(new Date(memo.date)) === formatDate(date)
  );

  useEffect(() => {
    setMemoContent(dateMemo?.content || "");
  }, [dateMemo, date]);

  const handleAddTodo = () => {
    if (!newTodoContent.trim()) return;

    const newTodo: TodoItem = {
      id: uuidv4(),
      date,
      content: newTodoContent,
      completed: false,
      createdAt: new Date(),
    };

    setTodos((prev) => [...prev, newTodo]);
    setNewTodoContent("");
  };

  const handleToggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleSaveMemo = () => {
    if (!memoContent.trim()) {
      // 내용이 비어있으면 메모 삭제
      if (dateMemo) {
        setMemos((prev) => prev.filter((memo) => memo.id !== dateMemo.id));
      }
      return;
    }

    const now = new Date();
    if (dateMemo) {
      // 기존 메모 업데이트
      setMemos((prev) =>
        prev.map((memo) =>
          memo.id === dateMemo.id
            ? { ...memo, content: memoContent, updatedAt: now }
            : memo
        )
      );
    } else {
      // 새 메모 생성
      const newMemo: MemoEntry = {
        id: uuidv4(),
        date,
        content: memoContent,
        createdAt: now,
        updatedAt: now,
      };
      setMemos((prev) => [...prev, newMemo]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTodo();
    }
  };

  return (
    <div className={styles.todoMemoContainer}>
      {/* 투두 리스트 섹션 */}
      <div className={styles.todoSection}>
        <div className={styles.todoInput}>
          <input
            type="text"
            value={newTodoContent}
            onChange={(e) => setNewTodoContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="할 일을 입력하세요"
            className={styles.input}
          />
          <button
            className={styles.addButton}
            onClick={handleAddTodo}
            disabled={!newTodoContent.trim()}
          >
            추가
          </button>
        </div>

        <div className={styles.todoList}>
          {dateTodos.length === 0 ? (
            <p className={styles.emptyMessage}></p>
          ) : (
            dateTodos.map((todo) => (
              <div
                key={todo.id}
                className={`${styles.todoItem} ${
                  todo.completed ? styles.completed : ""
                }`}
              >
                <button
                  className={styles.checkButton}
                  onClick={() => handleToggleTodo(todo.id)}
                >
                  {todo.completed ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                </button>
                <span className={styles.todoContent}>{todo.content}</span>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteTodo(todo.id)}
                >
                  <MdDelete />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Divider */}
      <div className={styles.divider}></div>

      {/* 메모 섹션 */}
      <div className={styles.memoSection}>
        <textarea
          value={memoContent}
          onChange={(e) => setMemoContent(e.target.value)}
          onBlur={handleSaveMemo}
          className={styles.memoTextarea}
          rows={6}
        />
      </div>
    </div>
  );
};

export default TodoMemo;
