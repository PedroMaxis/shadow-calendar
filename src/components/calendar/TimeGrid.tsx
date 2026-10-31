import { useEffect, useMemo, useRef } from "react";
import { endOfDay, format, isSameDay, isToday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CATEGORIES, layoutDay } from "@/lib/events";
import { useEvents } from "@/contexts/event-context";
import { useNow } from "@/hooks/useNow";

const HOUR_PX = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GRID_LINES = `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, hsl(var(--border)) ${
  HOUR_PX - 1
}px, hsl(var(--border)) ${HOUR_PX}px)`;

interface TimeGridProps {
  days: Date[];
  onEventClick: (eventId: string) => void;
  onCreate: (date: Date) => void;
}

/** Grade de horas usada pelas visões de semana e de dia */
const TimeGrid = ({ days, onEventClick, onCreate }: TimeGridProps) => {
  const { getOccurrences, selectedDate, setSelectedDate, setView } = useEvents();
  const now = useNow();
  const scroller = useRef<HTMLDivElement>(null);

  const from = startOfDay(days[0]);
  const to = endOfDay(days[days.length - 1]);
  const occurrences = useMemo(() => getOccurrences(from, to), [getOccurrences, from.getTime(), to.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  // abre já rolado para o horário atual (ou 7h em dias sem "agora")
  const hasToday = days.some(isToday);
  useEffect(() => {
    const hour = hasToday ? Math.max(0, new Date().getHours() - 1) : 7;
    scroller.current?.scrollTo({ top: hour * HOUR_PX });
  }, [hasToday, days.length]);

  const createAt = (day: Date, clientY: number, column: HTMLElement) => {
    const y = clientY - column.getBoundingClientRect().top;
    const minutes = Math.min(23 * 60 + 30, Math.max(0, Math.round((y / HOUR_PX) * 2) * 30));
    const date = startOfDay(day);
    date.setMinutes(minutes);
    onCreate(date);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div ref={scroller} className="max-h-[68vh] overflow-auto">
        {/* cabeçalho dos dias */}
        <div className="sticky top-0 z-20 flex border-b border-border bg-card">
          <div className="w-14 shrink-0" />
          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
            {days.map((day) => (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => {
                  setSelectedDate(day);
                  if (days.length > 1) setView("day");
                }}
                aria-label={format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
                className={cn(
                  "flex flex-col items-center gap-0.5 border-l border-border py-2 text-xs transition-colors first:border-l-0 hover:bg-accent/50",
                  isSameDay(day, selectedDate) && days.length > 1 && "bg-accent/40"
                )}
              >
                <span className="uppercase tracking-wide text-muted-foreground">
                  {format(day, days.length === 1 ? "EEEE" : "EEE", { locale: ptBR })}
                </span>
                <span
                  className={cn(
                    "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm font-medium",
                    isToday(day) && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* corpo */}
        <div className="flex">
          <div className="w-14 shrink-0">
            {HOURS.map((h) => (
              <div key={h} style={{ height: HOUR_PX }} className="relative pr-2 text-right text-[11px] text-muted-foreground">
                <span className="relative -top-2">{h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}</span>
              </div>
            ))}
          </div>

          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
            {days.map((day) => {
              const dayOccs = occurrences.filter((o) => o.start <= endOfDay(day) && o.end >= startOfDay(day));
              const placed = layoutDay(dayOccs, day);
              const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_PX;

              return (
                <div
                  key={day.toISOString()}
                  className="relative border-l border-border first:border-l-0"
                  style={{ height: HOUR_PX * 24, backgroundImage: GRID_LINES }}
                  onClick={(e) => createAt(day, e.clientY, e.currentTarget)}
                >
                  {placed.map(({ occ, top, height, column, columns }) => (
                    <button
                      key={occ.key}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(occ.event.id);
                      }}
                      style={{
                        top: (top / 60) * HOUR_PX + 1,
                        height: (height / 60) * HOUR_PX - 2,
                        left: `calc(${(column / columns) * 100}% + 2px)`,
                        width: `calc(${100 / columns}% - 4px)`,
                      }}
                      className={cn(
                        "absolute overflow-hidden rounded border-l-[3px] px-1.5 py-1 text-left text-xs leading-tight shadow-sm transition-opacity hover:opacity-80",
                        CATEGORIES[occ.event.category].chip,
                        occ.event.completed && "line-through opacity-50"
                      )}
                    >
                      <span className="block truncate font-medium">{occ.event.title}</span>
                      {height >= 40 && (
                        <span className="block truncate opacity-70">
                          {format(occ.start, "HH:mm")} – {format(occ.end, "HH:mm")}
                        </span>
                      )}
                    </button>
                  ))}

                  {isToday(day) && (
                    <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: nowTop }} aria-hidden="true">
                      <div className="relative h-px bg-rose-500">
                        <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeGrid;
