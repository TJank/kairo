-- Add WIDGET section type support
-- widgetType: "upcoming-events" | "countdown" | "weather"
-- widgetConfig: JSON string for widget-specific settings

ALTER TABLE "Section" ADD COLUMN "widgetType" TEXT;
ALTER TABLE "Section" ADD COLUMN "widgetConfig" TEXT;
