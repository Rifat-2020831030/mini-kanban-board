# Mini Kanban Board — Coding Guidelines

**This document serves as the global rulebook for all AI agents and developers working on this repository.**

## 1. Clean Code & Readability

- **Self-Explanatory Code**: Code must read like a story. Prioritize incredibly clear, descriptive variable and function names over comments.
- **Minimal Comments**: Do not write comments explaining _what_ the code does. Only use comments to explain _why_ a highly complex, unintuitive, or business-critical decision was made (e.g., explaining the fractional indexing math).
- **Functions**: Keep functions small and focused on a single responsibility (Single Responsibility Principle).
- **Magic Numbers**: Avoid magic numbers and strings. Extract them to well-named constants.

## 2. Industry Standard Vibe

- Follow the **Google TypeScript Style Guide** principles.
- Use explicit types, avoid `any` at all costs. Enable strict mode in `tsconfig.json`.
- Use early returns to avoid deep nesting (Guard Clauses).
- Prefer immutability. Use `const` by default, `let` only when necessary.

## 3. Workflow & Parallel Execution

- **Modular Commits**: Every small, logical chunk of work must be committed immediately. We use Conventional Commits (e.g., `feat: auth controller`, `fix: board permissions`).
- **Commit Approval**: Before making any git commit, you MUST ask the user for permission and present the proposed commit message to them. Wait for their explicit approval before proceeding to commit.
- **Parallel Subagents**: When possible, backend and frontend tasks that do not strictly depend on each other should be executed by spawning independent subagents concurrently.

## 4. Backend API Rules

- All requests must be validated at the middleware layer using **Zod**.
- Controllers should be lean; complex business logic (like role validation or cascade deletes) should reside in separate Service layers.
- **Testing**: Whenever an endpoint is built, the agent must test it immediately (e.g., using `curl`, Node scripts, or a test suite) before committing.

## 5. Frontend UI Rules

- Rely entirely on the tokens specified in `project-artifacts/design-system.md`.
- All state changes that trigger a network request (like dragging a task) must utilize **Optimistic UI** patterns via TanStack query mutations.
- Isolate components. A complex UI like a Kanban board must be broken down into extremely small, pure, reusable components.
