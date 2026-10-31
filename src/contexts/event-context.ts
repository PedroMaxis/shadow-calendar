import { createContext, useContext } from "react";
import type { CalendarEvent, EventCategory, Occurrence } from "@/lib/events";

export type CalendarView = "day" | "week" | "month";
export type CategoryFilter = EventCategory | "all";

export interface EventContextValue {
  events: CalendarEvent[];
  addEvent: (data: Omit<CalendarEvent, "id">) => void;
  updateEvent: (id: string, data: Partial<Omit<CalendarEvent, "id">>) => void;
  deleteEvent: (id: string) => void;
  toggleCompleted: (id: string) => void;
  importEvents: (list: CalendarEvent[]) => number;
  loadSamples: () => void;
  clearAll: () => void;

  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  filter: CategoryFilter;
  setFilter: (filter: CategoryFilter) => void;
  query: string;
  setQuery: (query: string) => void;

  /** Ocorrências no intervalo, já filtradas por categoria e busca */
  getOccurrences: (from: Date, to: Date) => Occurrence[];
}

export const EventContext = createContext<EventContextValue | undefined>(undefined);

export const useEvents = (): EventContextValue => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvents precisa estar dentro de <EventProvider>");
  return ctx;
};
