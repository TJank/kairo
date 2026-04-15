import { parse, format, isValid } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlanEntryCategory =
  | "DEEP_WORK"
  | "MEETING"
  | "ADMIN"
  | "PERSONAL_CARE"
  | "EXERCISE"
  | "MEAL"
  | "COMMUTE"
  | "SOCIAL"
  | "LEARNING"
  | "BREAK"
  | "OTHER";

export type ParsedPlanEntry = {
  title: string;
  startMin: number;
  endMin: number;
  category: PlanEntryCategory;
  description?: string;
};

// ─── Category Detection ─────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: [PlanEntryCategory, string[]][] = [
  ["EXERCISE", ["gym", "workout", "run ", "running", "yoga", "exercise", "strength", "cardio", "stretch", "walk ", "walking", "hike", "swim"]],
  ["MEAL", ["breakfast", "lunch", "dinner", "eat ", "eating", "meal", "snack", "coffee", "brunch", "cook"]],
  ["MEETING", ["meeting", "standup", "stand-up", "sync", "1:1", "one-on-one", "demo", "retro", "retrospective", "call ", "huddle", "interview", "check-in", "refinement"]],
  ["DEEP_WORK", ["deep work", "focus", "coding", "development", "writing", "implementation", "build ", "building", "develop", "code ", "program", "testing"]],
  ["ADMIN", ["admin", "email", "slack", "inbox", "planning", "review", "organize", "paperwork", "errands", "registration", "prep ", "wrap-up"]],
  ["PERSONAL_CARE", ["shower", "routine", "get ready", "morning routine", "skincare", "hygiene", "groom", "wake up", "wind down", "meditat", "bed prep", "shutdown", "journal", "reflection", "sleep"]],
  ["COMMUTE", ["commute", "drive", "driving", "transit", "travel", "bus ", "train "]],
  ["SOCIAL", ["social", "hang out", "catch up", "friends", "family time", "date "]],
  ["LEARNING", ["read ", "reading", "study", "learn", "course", "podcast", "lecture", "tutorial", "research", "class", "presentation", "university"]],
  ["BREAK", ["break", "rest", "nap", "downtime", "relax", "chill", "buffer", "transition", "reset"]],
];

export function detectCategory(title: string): PlanEntryCategory {
  const t = ` ${title.toLowerCase()} `;
  for (const [cat, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => t.includes(k))) return cat;
  }
  // Check for work-related keywords as secondary signal
  const workKeywords = ["standup", "scrum", "sprint", "jira", "qa", "deploy", "pr ", "merge", "backlog"];
  if (workKeywords.some((k) => t.includes(k))) return "DEEP_WORK";
  return "OTHER";
}

// ─── Time Parsing ───────────────────────────────────────────────────────────

/** Parse a time string into minutes from midnight. Handles AM/PM and bare H:MM. */
function parseTimeToken(str: string): number | null {
  const s = str.trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return null;

  // "6:30am", "10:00pm", "630am", "1030pm"
  const withAmPm = s.match(/^(\d{1,2}):?(\d{2})?(am|pm)$/);
  if (withAmPm) {
    let h = parseInt(withAmPm[1]);
    const m = withAmPm[2] ? parseInt(withAmPm[2]) : 0;
    const ampm = withAmPm[3];
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return h * 60 + m;
  }

  // "6am", "6pm"
  const hourAmPm = s.match(/^(\d{1,2})(am|pm)$/);
  if (hourAmPm) {
    let h = parseInt(hourAmPm[1]);
    const ampm = hourAmPm[2];
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    return h * 60;
  }

  // Bare "H:MM" or "H" — returns raw value, caller must handle AM/PM inference
  const bare = s.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (bare) {
    const h = parseInt(bare[1]);
    const m = bare[2] ? parseInt(bare[2]) : 0;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return h * 60 + m;
  }

  // date-fns fallback for "6:30 AM" style
  const now = new Date();
  const t1 = parse(str.trim(), "h:mm a", now);
  if (!isNaN(t1.getTime())) return t1.getHours() * 60 + t1.getMinutes();
  const t2 = parse(str.trim(), "h a", now);
  if (!isNaN(t2.getTime())) return t2.getHours() * 60 + t2.getMinutes();

  return null;
}

/** Check if a time token explicitly has AM/PM. */
function hasExplicitAmPm(str: string): boolean {
  return /(?:am|pm)/i.test(str);
}

// ─── Duration Parsing ───────────────────────────────────────────────────────

function parseDuration(text: string): number | null {
  const m = text.match(/\((\d+(?:\.\d+)?)\s*(?:hour|hr|h)\s*(?:(\d+)\s*(?:min|m))?\)/i);
  if (m) {
    const hours = parseFloat(m[1]);
    const mins = m[2] ? parseInt(m[2]) : 0;
    return Math.round(hours * 60) + mins;
  }
  const minOnly = text.match(/\((\d+)\s*(?:min(?:ute)?s?|m)\)/i);
  if (minOnly) return parseInt(minOnly[1]);
  return null;
}

function stripDuration(text: string): string {
  return text
    .replace(/\(\d+(?:\.\d+)?\s*(?:hour|hr|h)(?:\s*\d+\s*(?:min|m))?\)/i, "")
    .replace(/\(\d+\s*(?:min(?:ute)?s?|m)\)/i, "")
    .trim();
}

// ─── Line Parsing ───────────────────────────────────────────────────────────

function stripListMarker(line: string): string {
  return line.replace(/^\s*(?:[-*•]\s+|\d+\.\s+)/, "").trim();
}

type ParsedLine = {
  title: string;
  startMin: number;
  endMin: number | null;
  durationMin: number | null;
  description?: string;
  hasAmPm: boolean; // whether any time token had explicit AM/PM
};

/** Keep the full text as the title — dashes within the body are part of the title. */
function splitTitleDescription(text: string): { title: string; description?: string } {
  return { title: text };
}

/** Extract parenthetical text as description. */
function extractParenDescription(text: string): { clean: string; description?: string } {
  const match = text.match(/\(([^)]+)\)/);
  if (match) {
    const desc = match[1].trim();
    const clean = text.replace(/\s*\([^)]*\)\s*/g, " ").trim();
    return { clean, description: desc };
  }
  return { clean: text };
}

function parseLine(line: string): ParsedLine | null {
  const cleaned = stripListMarker(line);
  if (!cleaned) return null;

  const duration = parseDuration(cleaned);
  const textNoDuration = stripDuration(cleaned);

  // Time pattern: H:MM or H, optionally with AM/PM
  const TIME = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;

  // ── Pattern A: "TIME–TIME TITLE" or "TIME - TIME TITLE" (range + space + title)
  // This is the primary format: "8:15–8:30 Prep for registration"
  const rangeSpaceTitle = new RegExp(
    `^${TIME.source}\\s*[–\\-]\\s*${TIME.source}\\s+(.+)$`,
    "i",
  );
  let m = textNoDuration.match(rangeSpaceTitle);
  if (m) {
    const startRaw = m[1].trim();
    const endRaw = m[2].trim();
    const bodyRaw = m[3].trim();

    const startMin = parseTimeToken(startRaw);
    const endMin = parseTimeToken(endRaw);

    if (startMin !== null && endMin !== null) {
      const { clean: bodyClean, description: parenDesc } = extractParenDescription(bodyRaw);
      const { title, description: dashDesc } = splitTitleDescription(bodyClean);
      const description = [dashDesc, parenDesc].filter(Boolean).join(" — ") || undefined;
      const anyAmPm = hasExplicitAmPm(startRaw) || hasExplicitAmPm(endRaw);
      return { title, startMin, endMin, durationMin: duration, description, hasAmPm: anyAmPm };
    }
  }

  // ── Pattern B: "TIME - TIME - TITLE" (range + dash + title, original format)
  const rangeDashTitle = new RegExp(
    `^${TIME.source}\\s*[–\\-]\\s*${TIME.source}\\s*[–\\-:]\\s+(.+)$`,
    "i",
  );
  m = textNoDuration.match(rangeDashTitle);
  if (m) {
    const startRaw = m[1].trim();
    const endRaw = m[2].trim();
    const bodyRaw = m[3].trim();

    // Normalize AM/PM from end to start if missing
    const endAmPm = endRaw.match(/(am|pm)/i)?.[1];
    const normalizedStart =
      !hasExplicitAmPm(startRaw) && endAmPm ? startRaw + endAmPm : startRaw;

    const startMin = parseTimeToken(normalizedStart);
    const endMin = parseTimeToken(endRaw);

    if (startMin !== null && endMin !== null) {
      const { clean: bodyClean, description: parenDesc } = extractParenDescription(bodyRaw);
      const { title, description: dashDesc } = splitTitleDescription(bodyClean);
      const description = [dashDesc, parenDesc].filter(Boolean).join(" — ") || undefined;
      const anyAmPm = hasExplicitAmPm(startRaw) || hasExplicitAmPm(endRaw);
      return { title, startMin, endMin, durationMin: duration, description, hasAmPm: anyAmPm };
    }
  }

  // ── Pattern C: "TIME - TITLE" or "TIME TITLE" (start time only)
  const startOnly = new RegExp(
    `^${TIME.source}\\s*[–\\-:]?\\s+(.+)$`,
    "i",
  );
  m = textNoDuration.match(startOnly);
  if (m) {
    const startRaw = m[1].trim();
    const bodyRaw = m[2].trim();
    const startMin = parseTimeToken(startRaw);

    if (startMin !== null && bodyRaw) {
      const { clean: bodyClean, description: parenDesc } = extractParenDescription(bodyRaw);
      const { title, description: dashDesc } = splitTitleDescription(bodyClean);
      const description = [dashDesc, parenDesc].filter(Boolean).join(" — ") || undefined;
      return { title, startMin, endMin: null, durationMin: duration, description, hasAmPm: hasExplicitAmPm(startRaw) };
    }
  }

  return null;
}

// ─── AM/PM Inference ────────────────────────────────────────────────────────

/**
 * When times have no AM/PM markers (e.g. "8:15", "1:00"), infer based on
 * sequential context: times should always progress forward through the day.
 * Any time that would go backwards relative to the previous entry gets +12h.
 */
function inferAmPm(entries: ParsedLine[]): void {
  // Check if ANY entry has explicit AM/PM — if so, skip inference
  const anyExplicit = entries.some((e) => e.hasAmPm);
  if (anyExplicit) return;

  let prevStartMin = 0;
  for (const entry of entries) {
    let startMin = entry.startMin;
    let endMin = entry.endMin;

    // If start would go backwards, add 12 hours
    if (startMin < prevStartMin && startMin + 720 > prevStartMin) {
      startMin += 720;
    }

    // If end is set, ensure it's after start
    if (endMin !== null) {
      // If end < start, add 12 hours to end
      if (endMin <= startMin && endMin + 720 > startMin) {
        endMin += 720;
      }
    }

    entry.startMin = startMin;
    entry.endMin = endMin;
    prevStartMin = startMin;
  }
}

// ─── Date Detection ─────────────────────────────────────────────────────────

const MONTH_NAMES: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Try to parse a line as a date. Supports:
 * - "4/7/2026", "04/07/2026"
 * - "4-7-2026", "04-07-2026"
 * - "Monday April 7th 2026", "April 7, 2026", "April 7th, 2026"
 * - "Monday, April 7, 2026"
 * Returns YYYY-MM-DD string or null.
 */
function parseDateLine(line: string): string | null {
  const s = line.trim();

  // M/D/YYYY or MM/DD/YYYY or M-D-YYYY
  const numericDate = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (numericDate) {
    const month = parseInt(numericDate[1]) - 1;
    const day = parseInt(numericDate[2]);
    const year = parseInt(numericDate[3]);
    const d = new Date(year, month, day);
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }

  // Strip leading day name: "Monday April 7th 2026" → "April 7th 2026"
  // Also handles "Monday, April 7th, 2026"
  const stripped = s.replace(/^(?:mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)[,]?\s*/i, "").trim();

  // "April 7th 2026", "April 7 2026", "April 7th, 2026", "April 7, 2026"
  const namedDate = stripped.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(\d{4})$/i);
  if (namedDate) {
    const monthNum = MONTH_NAMES[namedDate[1].toLowerCase()];
    if (monthNum !== undefined) {
      const day = parseInt(namedDate[2]);
      const year = parseInt(namedDate[3]);
      const d = new Date(year, monthNum, day);
      if (isValid(d)) return format(d, "yyyy-MM-dd");
    }
  }

  return null;
}

// ─── Main Parser ────────────────────────────────────────────────────────────

export type ParseResult = {
  entries: ParsedPlanEntry[];
  detectedDate: string | null; // YYYY-MM-DD if first line was a date
};

export function parsePlanText(text: string): ParseResult {
  const lines = text.split(/\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { entries: [], detectedDate: null };

  // Check if the first line is a date
  let detectedDate: string | null = null;
  let startIdx = 0;
  const firstLineDate = parseDateLine(lines[0]);
  if (firstLineDate) {
    detectedDate = firstLineDate;
    startIdx = 1; // skip the date line
  }

  const parsed: ParsedLine[] = [];
  for (let i = startIdx; i < lines.length; i++) {
    const result = parseLine(lines[i]);
    if (result) parsed.push(result);
  }

  if (parsed.length === 0) return { entries: [], detectedDate };

  // Infer AM/PM for bare times based on sequential context
  inferAmPm(parsed);

  // Second pass: fill in missing endMin
  const entries: ParsedPlanEntry[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    let endMin: number;

    if (p.endMin !== null) {
      endMin = p.endMin;
    } else if (p.durationMin !== null) {
      endMin = p.startMin + p.durationMin;
    } else if (i + 1 < parsed.length) {
      endMin = parsed[i + 1].startMin;
    } else {
      endMin = p.startMin + 30;
    }

    entries.push({
      title: p.title,
      startMin: p.startMin,
      endMin,
      category: detectCategory(p.title),
      description: p.description,
    });
  }

  return { entries, detectedDate };
}

// ─── Formatting Helpers ─────────────────────────────────────────────────────

export function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12}:00 ${ampm}` : `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function formatDuration(startMin: number, endMin: number): string {
  const diff = endMin - startMin;
  if (diff <= 0) return "";
  if (diff >= 60) {
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${diff}m`;
}

// ─── Category Display ───────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<PlanEntryCategory, string> = {
  DEEP_WORK: "Deep Work",
  MEETING: "Meeting",
  ADMIN: "Admin",
  PERSONAL_CARE: "Personal Care",
  EXERCISE: "Exercise",
  MEAL: "Meal",
  COMMUTE: "Commute",
  SOCIAL: "Social",
  LEARNING: "Learning",
  BREAK: "Break",
  OTHER: "Other",
};

export const CATEGORY_COLORS: Record<PlanEntryCategory, string> = {
  DEEP_WORK: "bg-blue-400/15 text-blue-300 ring-blue-400/20",
  MEETING: "bg-purple-400/15 text-purple-300 ring-purple-400/20",
  ADMIN: "bg-zinc-400/15 text-zinc-300 ring-zinc-400/20",
  PERSONAL_CARE: "bg-teal-400/15 text-teal-300 ring-teal-400/20",
  EXERCISE: "bg-green-400/15 text-green-300 ring-green-400/20",
  MEAL: "bg-amber-400/15 text-amber-300 ring-amber-400/20",
  COMMUTE: "bg-orange-400/15 text-orange-300 ring-orange-400/20",
  SOCIAL: "bg-pink-400/15 text-pink-300 ring-pink-400/20",
  LEARNING: "bg-indigo-400/15 text-indigo-300 ring-indigo-400/20",
  BREAK: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/20",
  OTHER: "bg-zinc-400/15 text-zinc-400 ring-zinc-400/20",
};

export const ALL_CATEGORIES: PlanEntryCategory[] = [
  "DEEP_WORK",
  "MEETING",
  "ADMIN",
  "PERSONAL_CARE",
  "EXERCISE",
  "MEAL",
  "COMMUTE",
  "SOCIAL",
  "LEARNING",
  "BREAK",
  "OTHER",
];
