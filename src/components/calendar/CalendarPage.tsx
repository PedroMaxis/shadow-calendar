import { useCallback, useRef, useState } from "react";
import { eachDayOfInterval, endOfWeek, startOfWeek } from "date-fns";
import { CalendarPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/contexts/event-context";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import CalendarToolbar from "./CalendarToolbar";
import EventForm from "./EventForm";
import MonthView from "./MonthView";
import TimeGrid from "./TimeGrid";

const roundToNextHalfHour = (date: Date): Date => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  return d;
};

const CalendarPage = () => {
  const { events, view, selectedDate, loadSamples } = useEvents();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [defaultStart, setDefaultStart] = useState<Date | undefined>();
  const searchRef = useRef<HTMLInputElement>(null);

  const openNew = useCallback(
    (start?: Date) => {
      setEditingId(undefined);
      setDefaultStart(start ?? roundToNextHalfHour(selectedDate));
      setFormOpen(true);
    },
    [selectedDate]
  );
  const openEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  useKeyboardShortcuts(() => openNew(), searchRef);

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 0 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 0 }),
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
      <CalendarToolbar onNewEvent={() => openNew()} searchRef={searchRef} />

      {events.length === 0 && (
        <div className="mb-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <CalendarPlus className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">Sua agenda está vazia</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Crie seu primeiro evento ou clique em qualquer dia do calendário. Tudo fica salvo no seu navegador.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => openNew()}>
              <CalendarPlus className="h-4 w-4" /> Criar evento
            </Button>
            <Button variant="outline" onClick={loadSamples}>
              <Sparkles className="h-4 w-4" /> Ver com exemplos
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Atalhos: <kbd className="rounded border px-1">N</kbd> novo · <kbd className="rounded border px-1">T</kbd> hoje ·{" "}
            <kbd className="rounded border px-1">D</kbd>/<kbd className="rounded border px-1">W</kbd>/
            <kbd className="rounded border px-1">M</kbd> visões · <kbd className="rounded border px-1">←</kbd>/
            <kbd className="rounded border px-1">→</kbd> navegar
          </p>
        </div>
      )}

      {view === "month" && <MonthView onEventClick={openEdit} onCreate={openNew} />}
      {view === "week" && <TimeGrid days={weekDays} onEventClick={openEdit} onCreate={openNew} />}
      {view === "day" && <TimeGrid days={[selectedDate]} onEventClick={openEdit} onCreate={openNew} />}

      <EventForm open={formOpen} onOpenChange={setFormOpen} eventId={editingId} defaultStart={defaultStart} />
    </div>
  );
};

export default CalendarPage;
