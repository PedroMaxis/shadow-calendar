import { endOfWeek, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CalendarView } from "@/contexts/event-context";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Título do período exibido no topo do calendário (ex.: "Outubro de 2025") */
export const periodTitle = (view: CalendarView, date: Date): string => {
  if (view === "month") return capitalize(format(date, "MMMM 'de' yyyy", { locale: ptBR }));
  if (view === "day") return capitalize(format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }));
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return start.getMonth() === end.getMonth()
    ? `${format(start, "d")} – ${format(end, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
    : `${format(start, "d 'de' MMM", { locale: ptBR })} – ${format(end, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`;
};
