import { useMemo } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, type Occurrence } from "@/lib/events";
import { useEvents } from "@/contexts/event-context";

interface MonthViewProps {
  onEventClick: (eventId: string) => void;
  onCreate: (date: Date) => void;
}

const MAX_CHIPS = 3;
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

const MonthView = ({ onEventClick, onCreate }: MonthViewProps) => {
  const { selectedDate, setSelectedDate, setView, getOccurrences } = useEvents();

  const days = useMemo(() => {
    const first = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 });
    const last = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: first, end: last });
  }, [selectedDate]);

  const byDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    const occs = getOccurrences(days[0], new Date(days[days.length - 1].getTime() + 86_399_000));
    for (const occ of occs) {
      // eventos que passam da meia-noite aparecem em todos os dias que tocam
      const last = startOfDay(new Date(Math.max(occ.start.getTime(), occ.end.getTime() - 1)));
      for (const d of eachDayOfInterval({ start: startOfDay(occ.start), end: last })) {
        const key = format(d, "yyyy-MM-dd");
        map.set(key, [...(map.get(key) ?? []), occ]);
      }
    }
    return map;
  }, [days, getOccurrences]);

  const openDay = (day: Date) => {
    setSelectedDate(day);
    setView("day");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7" role="grid" aria-label={format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}>
        {days.map((day) => {
          const occs = byDay.get(format(day, "yyyy-MM-dd")) ?? [];
          const inMonth = isSameMonth(day, selectedDate);
          const selected = isSameDay(day, selectedDate);
          const label = `${format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}, ${
            occs.length === 0 ? "sem eventos" : occs.length === 1 ? "1 evento" : `${occs.length} eventos`
          }`;

          return (
            <div
              key={day.toISOString()}
              role="gridcell"
              aria-selected={selected}
              className={cn(
                "group relative min-h-[84px] border-b border-r border-border p-1 sm:min-h-[116px] [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-muted/30",
                selected && "bg-accent/60"
              )}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => openDay(day)}
                  aria-label={label}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:bg-accent",
                    !inMonth && "text-muted-foreground",
                    isToday(day) && "bg-primary font-semibold text-primary-foreground hover:bg-primary"
                  )}
                >
                  {format(day, "d")}
                </button>
                <button
                  type="button"
                  onClick={() => onCreate(day)}
                  aria-label={`Adicionar evento em ${format(day, "d 'de' MMMM", { locale: ptBR })}`}
                  className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <ul className="mt-1 space-y-0.5">
                {occs.slice(0, MAX_CHIPS).map((occ) => (
                  <li key={occ.key}>
                    <button
                      type="button"
                      onClick={() => onEventClick(occ.event.id)}
                      title={`${format(occ.start, "HH:mm")} · ${occ.event.title}`}
                      className={cn(
                        "flex w-full items-center gap-1 truncate rounded border-l-2 px-1.5 py-0.5 text-left text-xs transition-opacity hover:opacity-80",
                        CATEGORIES[occ.event.category].chip,
                        occ.event.completed && "line-through opacity-50"
                      )}
                    >
                      <span className="hidden shrink-0 tabular-nums opacity-70 sm:inline">{format(occ.start, "HH:mm")}</span>
                      <span className="truncate">{occ.event.title}</span>
                    </button>
                  </li>
                ))}
                {occs.length > MAX_CHIPS && (
                  <li>
                    <button
                      type="button"
                      onClick={() => openDay(day)}
                      className="px-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      +{occs.length - MAX_CHIPS} mais
                    </button>
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
