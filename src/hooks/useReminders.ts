import { useEffect } from "react";
import { addDays, addMinutes, format } from "date-fns";
import { toast } from "sonner";
import { expandEvents, type CalendarEvent, type Occurrence } from "@/lib/events";

const NOTIFIED_KEY = "shadow-calendar:notified";
const CHECK_EVERY_MS = 15_000;

const loadNotified = (): string[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};

const saveNotified = (ids: string[]) => {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(ids.slice(-200)));
  } catch {
    /* ignora */
  }
};

const whenText = (occ: Occurrence, now: Date): string => {
  const minutes = Math.round((occ.start.getTime() - now.getTime()) / 60000);
  if (minutes <= 0) return "em andamento";
  if (minutes < 60) return `começa em ${minutes} min`;
  return `às ${format(occ.start, "HH:mm")}`;
};

const notify = (occ: Occurrence, now: Date) => {
  const when = whenText(occ, now);
  toast(occ.event.title, { description: when, duration: 12_000 });

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(occ.event.title, {
      body: [when, occ.event.description].filter(Boolean).join(" · "),
      tag: occ.key,
    });
  }
};

/** Dispara lembretes (aviso na tela e, se permitido, notificação do navegador) enquanto o app estiver aberto */
export const useReminders = (events: CalendarEvent[]) => {
  useEffect(() => {
    const withReminder = events.filter((e) => e.reminder !== null && !e.completed);
    if (!withReminder.length) return;

    const check = () => {
      const now = new Date();
      const notified = loadNotified();
      let changed = false;

      for (const occ of expandEvents(withReminder, addMinutes(now, -1), addDays(now, 2))) {
        const trigger = occ.start.getTime() - (occ.event.reminder ?? 0) * 60000;
        const id = `${occ.key}@${occ.start.toISOString()}`;
        if (trigger <= now.getTime() && now < occ.end && !notified.includes(id)) {
          notify(occ, now);
          notified.push(id);
          changed = true;
        }
      }
      if (changed) saveNotified(notified);
    };

    check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [events]);
};
