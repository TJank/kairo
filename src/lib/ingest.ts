import { prisma } from "@/lib/prisma";
import {
  addDays,
  nextMonday,
  parse,
  set,
  startOfDay,
  endOfDay,
} from "date-fns";

const TZ = process.env.DASH_TIMEZONE || "America/New_York";

const WORK_KEYWORDS = [
  "standup",
  "scrum",
  "sync",
  "demo",
  "retro",
  "planning",
  "sprint",
  "jira",
  "qa",
  "fe",
  "backend",
  "frontend",
  "1:1",
];

function normalize(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function parseProjectKey(text: string): { key?: string; rest: string } {
  // Accept patterns like "FE: ..." or "ATHENA - ..."
  const m = text.match(/^\s*([A-Za-z][A-Za-z0-9_-]{1,15})\s*[:\-]\s*(.+)$/);
  if (m) return { key: m[1].toUpperCase(), rest: m[2] };
  return { rest: text };
}

function stripModePrefix(part: string) {
  const prefix = part.match(/^\s*(work|personal|family|todo|task)\s*[:\-]\s*(.+)$/i);
  if (!prefix) return { mode: undefined as undefined | string, body: part };
  return { mode: prefix[1].toLowerCase(), body: prefix[2] };
}

function looksWorkRelated(text: string) {
  const t = text.toLowerCase();
  return WORK_KEYWORDS.some((k) => t.includes(k));
}

function parseTimeRange(rest: string): { startMin?: number; endMin?: number; title: string } {
  // Handles:
  // - 9:00-9:30am
  // - 9-930
  // - 9-9:30
  // - 9am-930am
  const r = rest.match(
    /(.*?)(\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b)\s*(?:-|–|to)\s*(\b\d{1,4}(?::\d{2})?\s*(?:am|pm)?\b)(.*)/i,
  );
  if (!r) return { title: normalize(rest) };

  const before = normalize(r[1]);
  const startStr = normalize(r[2]);
  const endRaw = normalize(r[3]);
  const after = normalize(r[4]);

  const title = normalize([before, after].filter(Boolean).join(" "));

  const now = new Date();

  function normalizeEnd(end: string, start: string) {
    const hasAmPm = /\b(am|pm)\b/i.test(end);
    if (hasAmPm) return end;
    const startAmPm = start.match(/\b(am|pm)\b/i)?.[1];
    if (startAmPm) return end + " " + startAmPm;
    return end;
  }

  function normalizeStart(start: string, end: string) {
    const hasAmPm = /\b(am|pm)\b/i.test(start);
    if (hasAmPm) return start;
    const endAmPm = end.match(/\b(am|pm)\b/i)?.[1];
    if (endAmPm) return start + " " + endAmPm;
    // default assumption if neither specifies am/pm
    return start + " am";
  }

  function parseLooseTime(str: string) {
    const s = str.toLowerCase().replace(/\s+/g, "");
    // 930am -> 9:30 am
    const m = s.match(/^(\d{1,2})(\d{2})(am|pm)$/);
    if (m) return parse(`${m[1]}:${m[2]} ${m[3]}`,
      "h:mm a",
      now,
    );
    // 9am / 9:30am
    const t1 = parse(str, "h:mm a", now);
    if (!isNaN(t1.getTime())) return t1;
    const t2 = parse(str, "h a", now);
    return t2;
  }

  const endStr = normalizeEnd(endRaw, startStr);
  const startNorm = normalizeStart(startStr, endStr);

  const sDate = parseLooseTime(startNorm);
  const eDate = parseLooseTime(endStr);

  if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) return { title };

  const startMin = sDate.getHours() * 60 + sDate.getMinutes();
  const endMin = eDate.getHours() * 60 + eDate.getMinutes();
  return { title, startMin, endMin };
}

function parseDays(text: string): string | undefined {
  const t = text.toLowerCase();
  if (t.includes("mon-fri") || t.includes("m-f") || t.includes("m–f")) return "1,2,3,4,5";
  if (t.includes("mon-thu") || t.includes("mon-thurs")) return "1,2,3,4";
  if (t.includes("weekdays")) return "1,2,3,4,5";
  if (t.includes("daily")) return "0,1,2,3,4,5,6";
  return undefined;
}

function nextWorkStartDate() {
  const d = new Date();
  const day = d.getDay();
  // 0 Sun, 6 Sat -> next Monday
  if (day === 0 || day === 6) return startOfDay(nextMonday(d));
  return startOfDay(addDays(d, 1));
}

function tomorrowStartDate() {
  return startOfDay(addDays(new Date(), 1));
}

export async function ingestMessage(raw: string) {
  const text = normalize(raw);
  const lower = text.toLowerCase();

  // crude split for multi-items
  const parts = text
    .split(/\n|\s*;\s*/)
    .map((p) => normalize(p))
    .filter(Boolean);

  const created: any[] = [];

  for (const part of parts) {
    const pLower = part.toLowerCase();

    let mode: "work" | "personal" | "todo" | "unknown" = "unknown";
    let body = part;

    const stripped = stripModePrefix(part);
    if (stripped.mode) {
      body = stripped.body;
      if (stripped.mode === "work") mode = "work";
      else if (stripped.mode === "personal" || stripped.mode === "family") mode = "personal";
      else mode = "todo";
    } else {
      if (pLower.startsWith("todo ") || pLower.startsWith("task ")) {
        mode = "todo";
        body = part.replace(/^(todo|task)\s+/i, "");
      } else if (looksWorkRelated(part)) {
        mode = "work";
      }
    }

    const { key, rest } = parseProjectKey(body);
    const project = key
      ? await prisma.project.findUnique({ where: { key } })
      : null;

    if (mode === "todo") {
      // Due parsing: "before Friday" -> Friday 5pm; "by Friday" -> all-day Friday
      const dueBefore = rest.match(/\b(before|by)\s+(mon|tue|tues|tuesday|wed|wednesday|thu|thurs|thursday|fri|friday|sat|saturday|sun|sunday)\b/i);
      let dueAt: Date | null = null;
      let dueDate: Date | null = null;

      if (dueBefore) {
        const word = dueBefore[1].toLowerCase();
        const dayName = dueBefore[2].toLowerCase();
        const base = new Date();
        const map: any = { sun:0,sunday:0, mon:1, monday:1, tue:2, tues:2, tuesday:2, wed:3, wednesday:3, thu:4, thurs:4, thursday:4, fri:5, friday:5, sat:6, saturday:6 };
        const target = map[dayName];
        if (target != null) {
          const d = new Date(base);
          // advance to next target day (including same day if still upcoming)
          while (d.getDay() !== target) d.setDate(d.getDate()+1);
          if (word === "before") {
            dueAt = set(d, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 });
          } else {
            // "by" -> all-day
            dueDate = startOfDay(d);
          }
        }
      }

      const cleanText = normalize(rest.replace(/\b(before|by)\b.+$/i, "").trim() || rest);
      const t = await prisma.task.create({
        data: {
          text: cleanText,
          category: looksWorkRelated(part) ? "WORK" : "PERSONAL",
          projectId: project?.id,
          dueAt: dueAt ?? undefined,
          dueDate: dueDate ?? undefined,
        },
      });
      created.push({ type: "task", id: t.id, text: t.text });
      continue;
    }

    // Event / recurring event
    const days = parseDays(rest);
    const tr = parseTimeRange(rest);
    const title = tr.title || normalize(rest);

    const category = mode === "work" ? "WORK" : "PERSONAL";

    if (days && tr.startMin != null && tr.endMin != null) {
      const startDate = mode === "work" ? nextWorkStartDate() : tomorrowStartDate();
      const r = await prisma.recurringEvent.create({
        data: {
          title,
          category,
          projectId: project?.id,
          startDate,
          daysOfWeek: days,
          startMin: tr.startMin,
          endMin: tr.endMin,
        },
      });
      created.push({ type: "recurring", id: r.id, title: r.title });
    } else if (tr.startMin != null && tr.endMin != null) {
      // one-off event: assume tomorrow at that time
      const baseDate = mode === "work" ? nextWorkStartDate() : tomorrowStartDate();
      const startAt = set(baseDate, {
        hours: Math.floor(tr.startMin / 60),
        minutes: tr.startMin % 60,
        seconds: 0,
        milliseconds: 0,
      });
      const endAt = set(baseDate, {
        hours: Math.floor(tr.endMin / 60),
        minutes: tr.endMin % 60,
        seconds: 0,
        milliseconds: 0,
      });

      const e = await prisma.event.create({
        data: {
          title,
          category,
          projectId: project?.id,
          startAt,
          endAt,
        },
      });
      created.push({ type: "event", id: e.id, title: e.title });
    } else {
      // fallback: create all-day task tomorrow
      const dueDate = startOfDay(addDays(new Date(), 1));
      const t = await prisma.task.create({
        data: {
          text: title,
          category,
          projectId: project?.id,
          dueDate,
        },
      });
      created.push({ type: "task", id: t.id, text: t.text });
    }
  }

  return { created, tz: TZ };
}
