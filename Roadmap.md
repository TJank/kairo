# Kairo — Personal Command Center Roadmap

> Living checklist. Check off items as each phase completes.

---

## Phase 0 · Schema & Foundation
> Establish the correct data foundation before building any UI.

**Section model changes:**
- [x] Add `type` enum: `QUOTES | GOALS | DREAMBOARD | NOTES`
- [x] Add optional `color` String field (e.g. `"blue"`, `"emerald"`, `"rose"`)
- [x] `order` already exists — keep

**Item model changes:**
- [x] Add `completedAt` DateTime? (set when `done` is toggled true)
- [x] Add `dueDate` DateTime? (optional, used for GOALS type sections)

**Task model changes:**
- [x] Add `priority` enum: `HIGH | MEDIUM | LOW` (optional)
- [x] Add `completedAt` DateTime? (for auto-archive logic)

**RecurringEvent fix:**
- [x] Replace `daysOfWeek` CSV String with a `RecurringEventDay` junction table
  - `RecurringEventDay { id, recurringEventId, day Int (0–6) }`
- [x] Update `planner.ts` `parseDays()` to query the junction table

**Seeding:**
- [x] Move `ensureSeed()` out of page-load paths → create a `prisma/seed.ts` script
- [x] Remove `ensureSeed()` calls from `page.tsx` and `admin/page.tsx`

**Delete:**
- [x] Delete `src/app/admin/page.tsx`
- [x] Delete `src/app/admin/actions.ts`

**Migrate:**
- [x] Run `prisma migrate dev` for all schema changes

---

## Phase 1 · Whiteboard Page
> Replace the current dashboard with typed, inline-editable whiteboard sections.

**Routing:**
- [x] Keep at `/` (root route stays the whiteboard/dashboard)

**Section types & rules:**
- [x] `QUOTES` — full-width display, plain text items, no checkboxes, no due dates
- [x] `GOALS` — checklist items, checkbox toggles done + records `completedAt`, optional `dueDate` per item
- [x] `DREAMBOARD` — aspirational goals, same as GOALS but visually distinct (softer style)
- [x] `NOTES` — plain text blocks, no checkboxes

**Quotes section behavior:**
- [x] Always rendered first (sorted to top regardless of `order`)

**Empty state:**
- [x] If no sections exist: centered "No sections yet" message + "+ Add Section" button

**Add Section flow:**
- [x] "+ Add Section" button opens a modal
- [x] Modal fields: section title, type selector (radio/tabs), optional color picker (preset swatches)
- [x] On submit: creates section via Server Action, modal closes, section appears

**Per-section item management:**
- [x] Each section header has a "+" button to add an item inline
- [x] Items added inline (input appears, enter to submit)
- [x] Each item has an Edit button → opens inline edit form (text, optional due date for GOALS)
- [x] Each item has a Delete button (with confirmation)

**Goals/Dreamboard completion:**
- [x] Clicking checkbox sets `done = true`, `completedAt = now()`
- [x] Completed items show: strike-through text + "Completed [date]" label
- [x] Unchecking resets `done = false`, clears `completedAt`

**Section color:**
- [x] Optional accent color applied to section header/border
- [x] Preset palette: zinc (default), blue, emerald, rose, amber, purple, orange

**Server Actions (new file: `src/app/actions/whiteboard.ts`):**
- [x] `createSection(title, type, color?)`
- [x] `updateSection(id, title?, color?)`
- [x] `deleteSection(id)` — cascades to items
- [x] `createItem(sectionId, text, dueDate?)`
- [x] `updateItem(id, text?, dueDate?)`
- [x] `toggleItem(id)` — sets done + completedAt
- [x] `deleteItem(id)`
- [x] `reorderSections(orderedIds[])` — for future drag/drop

---

## Phase 2 · Tasks Page
> Project-grouped running task lists for work and personal use.

**Routing:**
- [x] New page at `/tasks`

**Layout:**
- [x] Tasks grouped by Project (uses existing `Project` model from planner)
- [x] "Personal" catch-all group for tasks with no project
- [x] Each group is a collapsible/expandable panel with tasks listed below
- [x] Clean, minimal list — priority badge (optional), subtask toggle (optional)

**Task CRUD:**
- [x] Add task inline within a project group (input at bottom of group)
- [x] Mark complete: checkbox → strikes through, records `completedAt`
- [x] Edit task: inline edit (text, optional priority, optional due date)
- [x] Delete task

**Auto-archive:**
- [x] Completed tasks with `completedAt` older than 7 days are filtered from the query
- [x] No cron needed — filter applied at query time in `lib/tasks.ts`

**Priority (optional):**
- [x] HIGH = red badge, MEDIUM = amber badge, LOW = zinc badge
- [x] Set via dropdown on the add/edit form

**Subtasks (optional):**
- [x] SubTask model: `{ id, taskId, text, done, order }`
- [x] Tasks with subtasks show a disclosure toggle "▸ 2 subtasks"
- [x] Subtasks listed when expanded, checkable inline

**Calendar linkage:**
- [x] Tasks with `dueDate` set show on the calendar's all-day row (already wired in `planner.ts`)

**Server Actions (new file: `src/app/actions/tasks.ts`):**
- [x] `createTask(text, projectId?, priority?, dueDate?)`
- [x] `updateTask(id, ...fields)`
- [x] `toggleTask(id)` — sets done + completedAt
- [x] `deleteTask(id)`
- [x] `createSubTask(taskId, text)`
- [x] `toggleSubTask(id)`
- [x] `deleteSubTask(id)`

---

## Phase 3 · Calendar Enhancements
> Improve event creation, category management, and event display.

**Category/Project management:**
- [x] "Manage Categories" button on calendar page → opens a slide-over or modal
- [x] List of existing projects (key, name, color swatch)
- [x] Create new: key (e.g. TD), name, color swatch picker
- [x] Edit/delete existing
- [x] Server Actions: `createProject`, `updateProject`, `deleteProject`

**Click-to-create events:**
- [x] Clicking an empty time slot on the grid opens an "Add Event" modal
- [x] Modal pre-fills date + start time from the clicked slot
- [x] Fields: title, category (optional dropdown), start time, end time, recurrence (none / Mon–Fri / daily / custom days)
- [x] On submit: creates Event or RecurringEvent depending on recurrence selection
- [x] Event shows immediately on the grid

**Event display format:**
- [x] If category assigned: `"[KEY]: Title"` (e.g. `"TD: Standup"`)
- [x] If no category: just `"Title"` (e.g. `"Doctor Appointment"`)
- [x] Color determined by project color; uncategorized events use a neutral color

**Ingest text input:**
- [x] Keep ingest API (`/api/ingest`)
- [x] Add a text input box on the calendar page (collapsible/drawer) for power-user entry
- [x] Submit fires ingest, refreshes the calendar

**Recurring event fix (from Phase 0):**
- [x] Update `planner.ts` to join `RecurringEventDay` table instead of splitting CSV

**Double-booking:**
- [x] Existing overlap detection in `WeekGrid.tsx` already handles this — verify it works after form entry

---

## Phase 4 · Navigation & Global Polish
> Unified navigation, consistent theme, empty states.

**Navigation bar:**
- [x] Persistent top nav in `layout.tsx`
- [x] Links: Whiteboard / Tasks / Calendar
- [x] Active route highlighted
- [x] App name "Kairo" on left

**Theme:**
- [x] Dark mode as default (already implemented)
- [x] ThemeToggle moved into nav bar
- [x] Consistent zinc-950 background across all pages

**Empty states:**
- [x] Tasks page: "No projects yet — create one to get started"
- [x] Calendar: "No events this week"
- [x] Whiteboard: "No sections yet" (Phase 1 handles this)

**Error handling:**
- [x] Form validation feedback (inline errors, not silent failures)
- [x] Toast/notification on successful save or delete

---

## Phase 5 · Windows Local Setup
> Document and finalize local Windows usage.

- [x] Update `README.md` with Windows setup steps (Node install, clone, npm install, prisma migrate, npm run dev)
- [x] Create `.env.local.example` with `DATABASE_URL` documented
- [x] Document where `dev.db` lives and how to back it up (copy the file)
- [x] Add npm convenience scripts: `db:studio`, `db:seed`, `db:reset`

---

## V2 · Future Enhancements (not in current scope)
> Planned but deferred to after core is stable.

- [ ] **Whiteboard drag-and-drop** — drag sections to reorder; drag items within a section
- [ ] **Whiteboard column spans** — sections can be set to full-width (Quotes) or half-width (Goals columns)
- [ ] **Calendar day view** — single-day detailed view
- [ ] **Calendar month view** — month overview
- [ ] **Task recurring items** — tasks that repeat weekly/monthly
- [ ] **Keyboard shortcuts** — power-user navigation
