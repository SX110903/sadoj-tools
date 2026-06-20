export type TimelineEventType = "audit" | "document" | "note" | "file" | "investigation" | "warrant" | "map";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  occurredAt: Date;
  href: string | null;
  actorName: string | null;
}

export function sortTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());
}

export function summarizeText(text: string, maxLength = 180): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}
