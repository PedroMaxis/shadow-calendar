import { useEffect } from "react";
import { addDays, addMonths, addWeeks, subDays, subMonths, subWeeks } from "date-fns";
import { useEvents } from "@/contexts/event-context";

/** Atalhos: T hoje · ←/→ navegar · D/W/M visualização · N novo evento · / buscar */
export const useKeyboardShortcuts = (onNew: () => void, searchInput: React.RefObject<HTMLInputElement>) => {
  const { view, setView, selectedDate, setSelectedDate } = useEvents();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (/^(input|textarea|select)$/i.test(target.tagName) || target.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;

      const step = (dir: 1 | -1) => {
        const fn =
          view === "day" ? (dir === 1 ? addDays : subDays) : view === "week" ? (dir === 1 ? addWeeks : subWeeks) : dir === 1 ? addMonths : subMonths;
        setSelectedDate(fn(selectedDate, 1));
      };

      switch (e.key.toLowerCase()) {
        case "t":
          setSelectedDate(new Date());
          break;
        case "arrowleft":
          step(-1);
          break;
        case "arrowright":
          step(1);
          break;
        case "d":
          setView("day");
          break;
        case "w":
          setView("week");
          break;
        case "m":
          setView("month");
          break;
        case "n":
          e.preventDefault();
          onNew();
          break;
        case "/":
          e.preventDefault();
          searchInput.current?.focus();
          break;
        default:
          return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, selectedDate, setSelectedDate, setView, onNew, searchInput]);
};
