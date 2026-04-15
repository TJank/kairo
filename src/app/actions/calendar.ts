"use server";

// Delegate to domain-specific modules for backwards compatibility.
// "use server" files can only export async functions, not bare re-exports.

import {
  createProject as _createProject,
  updateProject as _updateProject,
  deleteProject as _deleteProject,
} from "./projects";

import {
  createEvent as _createEvent,
  deleteEvent as _deleteEvent,
  updateEvent as _updateEvent,
  deleteRecurringEvent as _deleteRecurringEvent,
  updateRecurringEvent as _updateRecurringEvent,
  getRecurringEventData as _getRecurringEventData,
  cancelRecurringOccurrence as _cancelRecurringOccurrence,
} from "./events";

// ─── Project delegates ───────────────────────────────────────────────────────

export async function createProject(key: string, name: string, color: string, scope?: string) {
  return _createProject(key, name, color, scope);
}

export async function updateProject(id: string, name?: string, color?: string, scope?: string) {
  return _updateProject(id, name, color, scope);
}

export async function deleteProject(id: string) {
  return _deleteProject(id);
}

// ─── Event delegates ─────────────────────────────────────────────────────────

export async function createEvent(
  title: string,
  startAt: string,
  endAt: string,
  projectId?: string | null,
  recurrenceDays?: number[],
  notes?: string | null,
  biweekly?: boolean,
  allDay?: boolean
) {
  return _createEvent(title, startAt, endAt, projectId, recurrenceDays, notes, biweekly, allDay);
}

export async function deleteEvent(id: string) {
  return _deleteEvent(id);
}

export async function updateEvent(
  id: string,
  title: string,
  startAt: string,
  endAt: string,
  projectId?: string | null,
  notes?: string | null,
  allDay?: boolean
) {
  return _updateEvent(id, title, startAt, endAt, projectId, notes, allDay);
}

export async function deleteRecurringEvent(id: string) {
  return _deleteRecurringEvent(id);
}

export async function updateRecurringEvent(
  id: string,
  title: string,
  startMin: number,
  endMin: number,
  days: number[],
  projectId?: string | null,
  notes?: string | null,
  biweekly?: boolean,
  allDay?: boolean
) {
  return _updateRecurringEvent(id, title, startMin, endMin, days, projectId, notes, biweekly, allDay);
}

export async function getRecurringEventData(id: string) {
  return _getRecurringEventData(id);
}

export async function cancelRecurringOccurrence(recurringEventId: string, date: Date) {
  return _cancelRecurringOccurrence(recurringEventId, date);
}
