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

## Phase 6 · Today View & Logbook
> Daily focus view and completed-task history.

**Today View (`/today`):**
- [x] Dedicated `/today` route with nav link
- [x] Shows today's calendar events grouped by: happening now, upcoming, past
- [x] Shows tasks due today (by `dueDate` or `dueAt`)
- [x] Real-time clock-based event categorization
- [x] Task checkbox toggling with priority indicators
- [x] Color-coded project badges

**Logbook View (`/logbook`):**
- [x] Dedicated `/logbook` route with nav link
- [x] Completed tasks grouped by week ("Week of MMM d" labels)
- [x] Project-based filtering via query parameters (`?section=projectId`)
- [x] Priority badges and task notes display
- [x] Completion date tracking

---

## Phase 7 · Calendar Views & Event Editing
> Day view, month view, and full event editing.

**Calendar Day View (DayGrid.tsx):**
- [x] Single-day detailed view with hourly time slots (6am–8pm, 30-min intervals)
- [x] Full event details with notes
- [x] Click-to-create at time slots
- [x] All-day event row at top
- [x] Previous/next day navigation

**Calendar Month View (MonthGrid.tsx):**
- [x] Month calendar grid with day cells
- [x] Clickable days for navigation
- [x] Event popover on hover/click
- [x] Month navigation (previous/next)

**Event Editing (EditEventModal.tsx):**
- [x] Edit title, notes, start/end time, date
- [x] Category/project reassignment
- [x] All-day event toggle
- [x] Recurring event reconfiguration (days of week, biweekly toggle)
- [x] Delete event action

**Event Types:**
- [x] All-day events (rendered in separate row)
- [x] Biweekly recurring events
- [x] Recurring event exceptions (cancel specific occurrences)
- [x] Notes field on events

---

## Phase 8 · Settings & Timezone Support
> User-configurable settings and timezone-aware infrastructure.

**Settings Page (`/settings`):**
- [x] Dedicated `/settings` route with nav link
- [x] Timezone selector (9 timezone options: ET, CT, MT, PT, Alaska, Hawaii, London, Paris, UTC)
- [x] Persistent timezone storage in database via `Setting` model
- [x] "Saved!" confirmation feedback

**Timezone Infrastructure:**
- [x] Timezone conversion utilities (`fromZonedTime`, `toZonedTime`)
- [x] Default to Eastern Time with `DASH_TIMEZONE` env override
- [x] Applied globally for event display, due dates, and time parsing

---

## Phase 9 · Refactors & Code Quality
> Reduce duplication, improve consistency, and clean up the data model.

**Shared color palette (`src/lib/colors.ts`):**
- [x] Extract all color definitions into a single `lib/colors.ts` module
- [x] Export unified `COLOR_OPTIONS`, `COLOR_SWATCH`, `colorClasses()`, `SECTION_COLOR_OPTIONS`, `SECTION_COLOR_STYLES` from one place
- [x] Update `AddSectionModal`, `AddEventModal`, `EditEventModal`, `AddTaskModal`, `ManageCategoriesModal`, `SectionCard` to import from `lib/colors.ts`
- [x] Reduce old `calendar/colors.ts` to a re-export shim

**Type-safe timezone handling:**
- [x] Add request-level caching to `getTimezone()` via React `cache()` (one DB read per request)
- [x] All server actions use the cached version
- [x] Remove duplicate `DASH_TIMEZONE` fallback in `ingest.ts` — now uses shared `getTimezone()`

**Shared modal & form components (`src/components/`):**
- [x] Create `<Modal>` wrapper component (backdrop, centering, close behavior, Escape key)
- [x] Create `<ModalInput>`, `<ModalFieldLabel>`, `<ModalFooter>` components
- [x] Create `<ColorPicker>` component using shared palette
- [x] Refactor `AddEventModal`, `EditEventModal`, `AddTaskModal`, `AddSectionModal` to use shared components

**Consolidate Task `dueAt` / `dueDate`:**
- [x] Replace `dueAt` + `dueDate` with single `dueDate` field + `dueAllDay` Boolean (mirrors Event model)
- [x] Create Prisma migration (`20260330000000_consolidate_task_due`)
- [x] Update `actions/tasks.ts`, `AddTaskModal`, `TaskGroup`, `planner.ts`, `ingest.ts`, `today/page.tsx`, `TodayClient`
- [x] Remove old `dueAt` index

**Domain-grouped server actions:**
- [x] Split `actions/calendar.ts` into `actions/events.ts` and `actions/projects.ts`
- [x] Move task-section project actions from `actions/tasks.ts` into `actions/projects.ts`
- [x] `calendar.ts` and `tasks.ts` re-export from new modules for backwards compatibility

---

## Phase 10 · Dashboard Widgets
> New WIDGET section type for the whiteboard — turns it into a true command center.

**Schema:**
- [x] Add `WIDGET` to `SectionType` enum
- [x] Add `widgetType` String field on Section (e.g. `"countdown"`, `"upcoming-events"`, `"weather"`)
- [x] Add `widgetConfig` String field on Section (JSON blob for widget-specific settings)
- [x] Create Prisma migration (`20260330000001_widget_sections`)

**Widget types:**
- [x] **Upcoming Events** — shows today's remaining calendar events with times and project colors
- [x] **Countdown** — countdown to a user-specified target date with label
- [x] **Weather** — placeholder card (location display, ready for future API integration)

**Whiteboard integration:**
- [x] Widget sections render a `WidgetCard` component instead of an item list
- [x] Add Section modal: when WIDGET type is selected, show widget type picker + config fields
- [x] Widgets auto-refresh on page load (server-rendered, events fetched in `page.tsx`)

---

## Phase 11 · Daily Planner *(in progress)*
> Hourly day planner for structured daily scheduling — paste LLM-generated plans, track completion, and measure focus.

**Schema:**
- [x] Add `PlanEntryStatus` enum: `PLANNED | COMPLETED | SKIPPED | CANCELLED`
- [x] Add `PlanEntryCategory` enum: `DEEP_WORK | MEETING | ADMIN | PERSONAL_CARE | EXERCISE | MEAL | COMMUTE | SOCIAL | LEARNING | BREAK | OTHER`
- [x] `DailyPlan` model: `id`, `date` (unique), `notes`, timestamps
- [x] `PlanEntry` model: `planId`, `title`, `description`, `category`, `status`, `order`, `startMin`/`endMin` (minutes from midnight), `actualStartMin`/`actualEndMin`, `completedAt`, `eventId` (soft ref), timestamps
- [x] Migration applied via `prisma db push`

**Plan text parser (`src/lib/planParser.ts`):**
- [x] Parse pasted LLM output into structured `ParsedPlanEntry[]` objects
- [x] Support formats: `TIME - Title`, `TIME - TIME - Title`, markdown bullets, numbered lists, duration hints `(1 hour)`
- [x] Support bare times without AM/PM (e.g. `8:15–8:30 Title`) with sequential AM/PM inference
- [x] Support en-dash (`–`) as time range separator
- [x] Keep full title text including dashes (no splitting at `–` or `-`)
- [x] Date detection from first line of pasted text
- [x] Auto-detect category from title keywords (gym → EXERCISE, meeting → MEETING, etc.)
- [x] Infer missing end times from next entry's start time or duration hints
- [x] Format helpers: `formatMin()`, `formatDuration()`, category labels/colors

**Data layer (`src/lib/plannerData.ts`):**
- [x] `getDailyPlan(dateStr)` — fetch plan with entries ordered by order + startMin
- [x] `computeAnalytics(entries)` — completion rate, on-time rate, category breakdown

**Server actions (`src/app/actions/planner.ts`):**
- [x] `ensureDailyPlan(dateStr)` — get-or-create plan for a date
- [x] `createPlanEntry(planId, title, startMin, endMin, category?, description?)`
- [x] `bulkCreatePlanEntries(planId, entries[])` — batch insert from paste
- [x] `updatePlanEntryStatus(id, status)` — sets `completedAt` on COMPLETED
- [x] `updatePlanEntryActualTime(id, actualStartMin, actualEndMin)`
- [x] `updatePlanEntry(id, title?, startMin?, endMin?, category?, description?)`
- [x] `deletePlanEntry(id)`
- [x] `deleteDailyPlan(planId)` — delete entire plan with cascade
- [x] `updatePlanNotes(planId, notes)`
- [x] `reorderPlanEntries(orderedIds[])`
- [x] `getDayCalendarEvents(dateStr)` — fetch calendar events for cross-check
- [x] `createCalendarEvent(dateStr, title, startMin, endMin, category)` — create calendar event from planner

**Planner page (`/planner`):**
- [x] Server component with date param support (`?date=YYYY-MM-DD`)
- [x] Client component with date navigation (prev/next/today)
- [x] Timeline view with entry rows showing time, title, category badge, status
- [x] Status cycling on click: PLANNED → COMPLETED → SKIPPED → CANCELLED
- [x] Visual states: green for completed, strikethrough for skipped/cancelled, dimmed for cancelled
- [x] Hover actions: edit, delete (with confirmation), set actual time
- [x] Inline edit mode for entries (title, time, category)
- [x] Actual time pencil-in with inline time inputs
- [x] Quick add input at bottom of list for unplanned items

**Paste Modal (`PasteModal.tsx`):**
- [x] Large textarea with format placeholder
- [x] Parse → Preview → Save flow
- [x] Preview shows parsed entries with editable categories
- [x] Remove individual entries from preview before saving
- [x] Bulk save creates all entries at once
- [x] Date detection from first line (supports `4/7/2026`, `Monday April 7th 2026`, etc.)
- [x] Auto-navigate to detected date on save
- [x] Calendar cross-check: calendar events not in pasted text auto-added as suggestions (blue "From calendar" badge)
- [x] Calendar cross-check: meeting-type entries not on calendar flagged with "Not on calendar" badge + option to create calendar event on save

**Add Entry Modal (`AddEntryModal.tsx`):**
- [x] Manual entry with title, start/end time, category toggle, description
- [x] Auto-detect category from title as user types

**Navigation:**
- [x] "Planner" link added to NavBar after "Today"

**Plan management:**
- [x] Delete entire daily plan (two-click confirmation)
- [x] Day-of-year counter in header (`Day 96 (268 remaining)`)
- [x] Auto-ordering: entries sorted by startMin, then endMin, then title — applies on create, bulk create, and time edits
- [x] Dedicated skip button (MinusCircle) alongside check button for marking missed items
- [x] Actual time editor with styled inline inputs

**Inline analytics:**
- [x] Completion summary: X/Y completed, skipped count, cancelled count, % rate
- [x] Category time breakdown bar (colored horizontal bar)
- [x] Per-category time totals

**Calendar integration:**
- [x] Cross-check pasted plans against calendar events on parse
- [x] Auto-suggest missing calendar events as plan entries
- [x] Option to create calendar events from unmatched meeting entries on save

**Future planner enhancements:** *(planned)*
- [ ] Drag-and-drop reorder via @dnd-kit
- [ ] Day notes/reflection textarea on DailyPlan
- [ ] Plan templates — save a plan structure, apply to future days
- [ ] Weekly/monthly analytics dashboard with trends and charts
- [ ] Voice input via Web Speech API → parser pipeline
- [ ] In-app LLM integration to generate plans from voice/text
- [ ] Smart suggestions based on recurring patterns

---

## V2 · Future Enhancements (not in current scope)
> Planned but deferred to after core is stable.

- [ ] **Whiteboard drag-and-drop** — drag sections to reorder; drag items within a section
- [ ] **Whiteboard column spans** — sections can be set to full-width (Quotes) or half-width (Goals columns)
- [x] **Calendar day view** — single-day detailed view *(done in Phase 7)*
- [x] **Calendar month view** — month overview *(done in Phase 7)*
- [ ] **Task recurring items** — tasks that repeat weekly/monthly
- [ ] **Keyboard shortcuts** — power-user navigation
