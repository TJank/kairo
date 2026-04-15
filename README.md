# Kairo — Personal Command Center

A self-hosted personal command center running entirely on a local Windows machine.
No auth, no cloud. SQLite database + Next.js + Prisma.

**Pages:**
- **Whiteboard** (`/`) — typed sections (Quotes, Goals, Dreamboard, Notes)
- **Tasks** (`/tasks`) — project-grouped task lists with subtasks and priorities
- **Calendar** (`/calendar`) — week view with color-coded categories, click-to-create events

---

## Windows Setup

### Prerequisites

1. **Node.js 20+** — download from [nodejs.org](https://nodejs.org). Use the LTS installer.
2. **Git** — download from [git-scm.com](https://git-scm.com).

### First-time setup

Open **PowerShell** or **Command Prompt** and run:

```powershell
# 1. Clone the repo
git clone <repo-url> kairo
cd kairo

# 2. Install dependencies
npm install

# 3. Create your .env file
copy .env.local.example .env

# 4. Run the database migration (creates prisma/dev.db)
npx prisma migrate deploy

# 5. (Optional) Seed the database with sample data
npm run db:seed

# 6. Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

> **TV mode tip:** Open the browser full-screen (`F11`) with Whiteboard or Calendar for a clean dashboard display.

---

## Database

The SQLite database lives at `prisma/dev.db`.

**To back it up:** copy the file anywhere — it's self-contained.

```powershell
copy prisma\dev.db prisma\dev.db.bak
```

**To view/edit data** in a GUI:

```powershell
npm run db:studio
```

This opens Prisma Studio at [http://localhost:5555](http://localhost:5555).

**To reset all data** (wipes DB and re-runs migrations):

```powershell
npm run db:reset
```

---

## npm Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:seed` | Populate DB with sample whiteboard data |
| `npm run db:reset` | Wipe and re-migrate the database |

---

## Environment Variables

See `.env.local.example` for all available variables.

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Path to SQLite file (relative to `prisma/` folder) |
| `DASH_TIMEZONE` | `America/New_York` | Timezone for event parsing in the ingest API |

---

## Quick Ingest Reference

On the Calendar page, the **Quick Add** drawer accepts natural language:

| Input | Creates |
|---|---|
| `work: standup 9-930am mon-fri` | Recurring event Mon–Fri 9:00–9:30 |
| `TD: planning 10-11am` | One-off event tagged to project TD |
| `todo: finish report by Friday` | Task due Friday (all-day) |
| `personal: doctor 2-3pm` | One-off personal event tomorrow |
