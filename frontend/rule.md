# Refactoring Rules & Architectural Patterns

This document outlines the standard patterns for refactoring pages and components in the project to ensure consistency, maintainability, and clear separation of concerns.

## 1. Page Component Structure (The Wrapper Pattern)
Pages should act as **orchestrators** rather than containing complex UI or logic. 
- **Responsibility**: Fetch initial data, initialize hooks, and compose sub-components.
- **Directive**: Must include `"use client"` if it uses any hooks.
- **Layout**:
  - Toolbar (Search/Filters/Add Action)
  - Data Table (Display only)
  - Batch Actions (Floating bar)
  - Dialogs (Forms/Confirmations)

## 2. Centralized Logic (The Custom Hook Pattern)
All page-level state and logic (filtering, sorting, selection, pagination, batch actions) must be moved to a dedicated custom hook.
- **Location**: Store in `src/hooks/[feature]/use-[feature]-logic.ts`.
- **Exposed API**: The hook should return all necessary state variables and event handlers needed by the page and its sub-components.

## 3. Component Responsibility (Dumb Components)
UI components (like tables) should be **"dumb"** or **display-only**.
- **Data via Props**: Receive all data and state-derived items (like `paginatedItems`) via props.
- **Handlers via Props**: Receive event handlers (like `onToggleSelect`, `onEdit`) via props.
- **No Internal State**: Avoid local state for data management; let the parent hook handle it.
- **No Dialog Triggers**: Avoid embedding dialog triggers inside data components if they manage page-level state. Pass triggers or callback-based handlers instead.

## 4. Selection & Batch Actions
- **Selection**: Use a `Set<string | number>` for row selection.
- **Batch Actions**: Separate batch action logic into a floating bar component (`[Feature]BatchActions`).
- **Confirmation**: Use `AlertDialog` for destructive batch actions (e.g., delete) and `Dialog` for non-destructive updates (e.g., status change).

## 5. Directory Organization
- **Hooks**: Prefer shared hooks in `src/hooks` over nested `hooks` folders within component directories to avoid duplication and maintain a flat, accessible structure.
- **Dialogs**: Group related dialog components in a `dialogs` sub-directory within the feature's component folder (e.g., `src/components/schedule/dialogs/`).

## 6. Linting & Type Safety
- Always use `const` for variables that are not reassigned (prefer-const).
- Ensure all components are properly typed using interfaces.
- Run `npm run lint` and `npx tsc --noemit` before finalizing changes.
