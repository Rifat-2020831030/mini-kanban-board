# Project Handover: Mini Kanban Board Implementation

**Welcome to the Implementation Phase!**
The planning and architecture phase for the Mini Kanban Board is 100% complete. This document contains everything you need to know to immediately begin writing code. 

## 1. Project Context
We are building a highly performant, real-time "Mini Kanban Board". It features strict role-based access control, optimistic UI drag-and-drop mechanics, fractional indexing for task ordering, and granular permissions down to the column and task hand-off level.

## 2. Source of Truth Documents
Before writing any code, you MUST review the specification artifacts located in `d:\Programming\task\mini-kanban-board\project-artifacts\`:
1. `feature_spec.md`: The central technical spec (Database schema, Zod rules, Socket events, HTTP codes, Role Matrix).
2. `api-spec.md`: The complete REST API endpoint contracts.
3. `non-technical-feature-spec.md`: The business requirements and user stories.
4. `er-diagram.md`: The PostgreSQL entity-relationship diagram.
5. `sequence-diagrams.md`: Backend execution flows for complex actions.
6. `design-system.md`: The "High-Contrast Dark Mode" UI tokens and Tailwind rules.

## 3. Coding Guidelines
There is a strictly enforced coding guideline file located at `d:\Programming\task\mini-kanban-board\.agents\rules\coding-guidelines.md`.
**You must follow these rules.** They enforce clean code, zero "what" comments, modular conventional commits, and mandatory endpoint testing. 
**Note:** When committing code, you MUST use the `git-commit` skill located in `.agents/skills/git-commit/SKILL.md` and ensure there is **only one logical change per commit**.

## 4. Execution Strategy (The Sprint Plan)
The project is broken down into 6 Sprints, defined in `project-artifacts/sprint-plan.md`. 
Because the frontend and backend architectures are decoupled, we are executing them in parallel.

### Your Immediate Directives:
1. **Frontend**: Spawn an autonomous subagent to immediately begin **Sprint 4** (Scaffolding Next.js, Tailwind v4, shadcn/ui, Zustand). Give the subagent the design-system.md file to implement the dark mode tokens.
2. **Backend**: While the subagent works on the frontend, you must personally begin executing **Sprint 1** (Initialize Express, setup Docker PostgreSQL, configure Prisma, and build the Auth controllers).

Please read the `sprint-plan.md` and `feature_spec.md` first, and then execute the directives above!
