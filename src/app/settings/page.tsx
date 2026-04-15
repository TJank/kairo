import { getTimezone, TIMEZONES } from "@/lib/timezone";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const currentTz = await getTimezone();
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">Settings</h1>
      <SettingsClient currentTz={currentTz} timezones={TIMEZONES} />
    </main>
  );
}
