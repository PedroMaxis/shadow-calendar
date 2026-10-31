import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  expandEvents,
  newId,
  parseEvents,
  sampleEvents,
  serializeEvents,
  type CalendarEvent,
} from "@/lib/events";
import { useReminders } from "@/hooks/useReminders";
import { EventContext, type CalendarView, type CategoryFilter } from "./event-context";

const STORAGE_KEY = "shadow-calendar:v1";
const LEGACY_PREFIX = "events-"; // formato da versão antiga (uma chave por usuário fictício)

/** Carrega os eventos salvos; se não houver, tenta aproveitar os da versão antiga */
const loadInitialEvents = (): CalendarEvent[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return parseEvents(saved) ?? [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(LEGACY_PREFIX)) continue;
      const legacy = parseEvents(localStorage.getItem(key) ?? "");
      if (legacy?.length) return legacy;
    }
  } catch {
    /* localStorage indisponível */
  }
  return [];
};

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<CalendarEvent[]>(loadInitialEvents);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeEvents(events));
    } catch {
      toast.error("Não foi possível salvar: o armazenamento do navegador está cheio ou bloqueado.");
    }
  }, [events]);

  useReminders(events);

  const addEvent = useCallback((data: Omit<CalendarEvent, "id">) => {
    setEvents((prev) => [...prev, { ...data, id: newId() }]);
    toast.success("Evento criado");
  }, []);

  const updateEvent = useCallback((id: string, data: Partial<Omit<CalendarEvent, "id">>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    toast.success("Evento atualizado");
  }, []);

  const deleteEvent = useCallback(
    (id: string) => {
      const removed = events.find((e) => e.id === id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast("Evento excluído", {
        action: removed
          ? { label: "Desfazer", onClick: () => setEvents((prev) => [...prev, removed]) }
          : undefined,
      });
    },
    [events]
  );

  const toggleCompleted = useCallback((id: string) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)));
  }, []);

  const importEvents = useCallback(
    (list: CalendarEvent[]): number => {
      const known = new Set(events.map((e) => e.id));
      const fresh = list.filter((e) => !known.has(e.id));
      if (fresh.length) setEvents((prev) => [...prev, ...fresh]);
      return fresh.length;
    },
    [events]
  );

  const loadSamples = useCallback(() => {
    setEvents((prev) => [...prev, ...sampleEvents()]);
    toast.success("Eventos de exemplo adicionados");
  }, []);

  const clearAll = useCallback(() => {
    const removed = events;
    setEvents([]);
    toast("Todos os eventos foram apagados", {
      action: { label: "Desfazer", onClick: () => setEvents(removed) },
    });
  }, [events]);

  const getOccurrences = useCallback(
    (from: Date, to: Date) => {
      const q = query.trim().toLowerCase();
      const visible = events.filter(
        (e) =>
          (filter === "all" || e.category === filter) &&
          (!q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
      );
      return expandEvents(visible, from, to);
    },
    [events, filter, query]
  );

  const value = useMemo(
    () => ({
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      toggleCompleted,
      importEvents,
      loadSamples,
      clearAll,
      selectedDate,
      setSelectedDate,
      view,
      setView,
      filter,
      setFilter,
      query,
      setQuery,
      getOccurrences,
    }),
    [
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      toggleCompleted,
      importEvents,
      loadSamples,
      clearAll,
      selectedDate,
      view,
      filter,
      query,
      getOccurrences,
    ]
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};
