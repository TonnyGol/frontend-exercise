Tests:

src/core/state/useUploadStore.test.ts
 — 20 tests covering:

addFiles — adds to empty store, appends without replacing
updateFile (state transitions) — queued→uploading, uploading→processing, uploading→failed, doesn't mutate sibling files
cancelFile edge cases — cancels queued, cancels uploading (resets progress), calls abort(), does NOT cancel already-accepted or already-failed files
updateFilesBatch — multiple files in one call, leaves unmatched files untouched
removeFile — removes by id, no-op for non-existent id
selectUploadSummary — zeros on empty, queued+uploading grouped, each terminal status counted correctly, summary reflects cancel, summary reflects batch updates

src/core/validation.test.ts
 — 14 tests covering:

Valid files — .txt, .pdf, images, exactly-at-limit (10MB boundary)
Blocked extensions — all 6 blocked types (.exe, .dll, .bat, .cmd, .msi, .scr), case-insensitive (.EXE)
Size limits — over 10MB, exactly 10MB+1 byte boundary
Empty files — 0-byte rejection