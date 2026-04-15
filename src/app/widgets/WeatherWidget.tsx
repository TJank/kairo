"use client";

type WeatherConfig = {
  location?: string;
};

function parseConfig(configStr: string | null): WeatherConfig {
  if (!configStr) return {};
  try {
    return JSON.parse(configStr);
  } catch {
    return {};
  }
}

export default function WeatherWidget({ config }: { config: string | null }) {
  const parsed = parseConfig(config);

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-2xl ring-1 ring-sky-500/20">
        <span role="img" aria-label="weather">
          {"\u2600\uFE0F"}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-200">
          {parsed.location || "Weather"}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Connect a weather API in settings to see live data.
        </p>
        <p className="mt-1 text-[10px] text-zinc-600">
          Placeholder — ready for API integration
        </p>
      </div>
    </div>
  );
}
