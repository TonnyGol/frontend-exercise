# Frontend Upload Portal

A robust, modern React application for batch file uploads with real-time status tracking, animated transitions, and comprehensive error handling.

## Setup Instructions
1. Ensure you have Node.js (v18 or higher) installed on your system.
2. Clone this repository to your local machine.
3. Open a terminal in the root of the frontend project directory.
4. Run `npm install` to download and install all required dependencies.

## Run Instructions
1. **Start the Backend:** Run the provided backend executable (`upload-server.exe`). It must be running on `http://127.0.0.1:3000`.
2. **Start the Frontend:** In your terminal, run `npm run dev`.
3. Open your web browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`).
4. **Run Tests (Optional):** To verify the business logic, run `npm run test` or `npm run test -- --run`.

## Assumptions
- **Backend API Stability:** The provided backend REST API endpoints behave as documented in the OpenAPI specification.
- **CORS Bypass:** The Vite development server proxy is configured to forward `/upload` and `/files` traffic to `127.0.0.1:3000` to prevent Cross-Origin Resource Sharing (CORS) errors during local development.
- **File Batch Sizes:** The number of files uploaded simultaneously is reasonably sized (e.g., < 1000). For massive bulk uploads, DOM virtualization would be required.

## Trade-offs
- **Polling vs. WebSockets:** Because the backend only provides a REST API, we must use short-polling (`GET /files`) to check for file status updates (processing, accepted, rejected). This introduces slightly more network overhead than a WebSocket connection, but was the only path forward given the backend contract.
- **In-Memory State:** Upload state is managed transiently in-memory using Zustand. If a user refreshes the page, the active upload UI state is lost. Storing state in `localStorage` was considered, but skipped to avoid complex cache invalidation bugs (e.g., how to handle an interrupted upload when the browser is reopened a day later).
- **Tailwind `@apply` Directives:** We opted to use Tailwind CSS utility classes inside CSS files via the `@apply` directive. While some prefer inline utility classes in JSX, using `@apply` for complex components keeps the React code much cleaner and easier to read.

---

## Test Coverage Summary
The project includes a suite of robust unit tests powered by Vitest.

### `src/core/state/useUploadStore.test.ts`
*20 tests covering:*
- `addFiles` — adds to empty store, appends without replacing
- `updateFile` (state transitions) — queued→uploading, uploading→processing, uploading→failed, doesn't mutate sibling files
- `cancelFile` edge cases — cancels queued, cancels uploading (resets progress), calls abort(), does NOT cancel already-accepted or already-failed files
- `updateFilesBatch` — multiple files in one call, leaves unmatched files untouched
- `removeFile` — removes by id, no-op for non-existent id
- `selectUploadSummary` — zeros on empty, queued+uploading grouped, each terminal status counted correctly, summary reflects cancel, summary reflects batch updates

### `src/core/validation.test.ts`
*14 tests covering:*
- Valid files — `.txt`, `.pdf`, images, exactly-at-limit (10MB boundary)
- Blocked extensions — all 6 blocked types (`.exe`, `.dll`, `.bat`, `.cmd`, `.msi`, `.scr`), case-insensitive (`.EXE`)
- Size limits — over 10MB, exactly 10MB+1 byte boundary
- Empty files — 0-byte rejection