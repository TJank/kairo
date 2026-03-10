import { prisma } from "@/lib/prisma";
import { fromZonedTime, toZonedTime, format as fmtTz } from "date-fns-tz";

export const DEFAULT_TZ = "America/New_York";

/** Reads the saved timezone from the DB, falling back to the env var then Eastern. */
export async function getTimezone(): Promise<string> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "timezone" } });
    return row?.value ?? process.env.DASH_TIMEZONE ?? DEFAULT_TZ;
  } catch {
    return process.env.DASH_TIMEZONE ?? DEFAULT_TZ;
  }
}

/**
 * Parse a date-input string ("YYYY-MM-DD") as midnight in the given timezone
 * and return the UTC Date to store.
 * e.g. "2026-03-10" + "America/New_York" → 2026-03-10T05:00:00Z
 */
export function parseDateInTz(dateStr: string, tz: string): Date {
  return fromZonedTime(`${dateStr}T00:00:00`, tz);
}

/**
 * Parse a datetime-input string ("YYYY-MM-DDTHH:MM") in the given timezone
 * and return the UTC Date to store.
 */
export function parseDateTimeInTz(isoLocal: string, tz: string): Date {
  return fromZonedTime(isoLocal, tz);
}

/**
 * Format a UTC Date as a date string in the given timezone.
 * Returns e.g. "Mar 10" or "Mar 10, 2026"
 */
export function formatDateInTz(
  date: Date,
  tz: string,
  fmt = "MMM d"
): string {
  return fmtTz(date, fmt, { timeZone: tz });
}

/** All supported timezones we expose in the settings UI. */
export const TIMEZONES = [
  { label: "Eastern (ET)",   value: "America/New_York" },
  { label: "Central (CT)",   value: "America/Chicago" },
  { label: "Mountain (MT)",  value: "America/Denver" },
  { label: "Pacific (PT)",   value: "America/Los_Angeles" },
  { label: "Alaska (AKT)",   value: "America/Anchorage" },
  { label: "Hawaii (HAT)",   value: "Pacific/Honolulu" },
  { label: "London (GMT/BST)", value: "Europe/London" },
  { label: "Paris (CET/CEST)", value: "Europe/Paris" },
  { label: "UTC",            value: "UTC" },
];
