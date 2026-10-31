import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  endOfDay,
  startOfDay,
} from "date-fns";

export type EventCategory = "work" | "personal" | "health" | "meeting" | "other";
export type RepeatRule = "none" | "daily" | "weekly" | "monthly";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  category: EventCategory;
  completed: boolean;
  /** Minutos de antecedência do lembrete; 0 = na hora; null = sem lembrete */
  reminder: number | null;
  repeat: RepeatRule;
}

/** Uma ocorrência concreta de um evento (eventos recorrentes geram várias) */
export interface Occurrence {
  event: CalendarEvent;
  start: Date;
  end: Date;
  key: string;
}

export const CATEGORIES: Record<
  EventCategory,
  { label: string; dot: string; chip: string }
> = {
  work: {
    label: "Trabalho",
    dot: "bg-blue-500",
    chip: "border-l-blue-500 bg-blue-500/15 text-blue-900 dark:text-blue-100",
  },
  personal: {
    label: "Pessoal",
    dot: "bg-emerald-500",
    chip: "border-l-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100",
  },
  health: {
    label: "Saúde",
    dot: "bg-rose-500",
    chip: "border-l-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-100",
  },
  meeting: {
    label: "Reunião",
    dot: "bg-amber-500",
    chip: "border-l-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100",
  },
  other: {
    label: "Outro",
    dot: "bg-violet-500",
    chip: "border-l-violet-500 bg-violet-500/15 text-violet-900 dark:text-violet-100",
  },
};

export const CATEGORY_ORDER = Object.keys(CATEGORIES) as EventCategory[];

export const REPEAT_LABELS: Record<RepeatRule, string> = {
  none: "Não repete",
  daily: "Todos os dias",
  weekly: "Toda semana",
  monthly: "Todo mês",
};

export const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Sem lembrete" },
  { value: 0, label: "Na hora do evento" },
  { value: 5, label: "5 minutos antes" },
  { value: 15, label: "15 minutos antes" },
  { value: 30, label: "30 minutos antes" },
  { value: 60, label: "1 hora antes" },
  { value: 1440, label: "1 dia antes" },
];

export const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/* ------------------------------------------------------------------ recorrência */

const shiftBy = (start: Date, repeat: RepeatRule, n: number): Date => {
  switch (repeat) {
    case "daily":
      return addDays(start, n);
    case "weekly":
      return addWeeks(start, n);
    case "monthly":
      return addMonths(start, n);
    default:
      return start;
  }
};

/** A partir de qual repetição vale a pena começar a iterar para chegar em `from` */
const firstRepeatIndex = (start: Date, repeat: RepeatRule, from: Date): number => {
  let n = 0;
  if (repeat === "daily") n = differenceInCalendarDays(from, start);
  if (repeat === "weekly") n = Math.floor(differenceInCalendarDays(from, start) / 7);
  if (repeat === "monthly") n = differenceInCalendarMonths(from, start);
  return Math.max(0, n - 1);
};

/** Ocorrências de todos os eventos que tocam o intervalo [from, to] */
export const expandEvents = (events: CalendarEvent[], from: Date, to: Date): Occurrence[] => {
  const out: Occurrence[] = [];
  for (const event of events) {
    const duration = event.end.getTime() - event.start.getTime();
    const push = (start: Date, n: number) => {
      const end = new Date(start.getTime() + duration);
      if (end >= from && start <= to) {
        out.push({ event, start, end, key: `${event.id}:${n}` });
      }
    };

    if (event.repeat === "none") {
      push(event.start, 0);
      continue;
    }

    const first = firstRepeatIndex(event.start, event.repeat, from);
    for (let n = first; n < first + 800; n++) {
      const start = shiftBy(event.start, event.repeat, n);
      if (start > to) break;
      push(start, n);
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());
};

export const occurrencesOnDay = (events: CalendarEvent[], day: Date): Occurrence[] =>
  expandEvents(events, startOfDay(day), endOfDay(day));

/* ------------------------------------------------------------------ layout da grade de horas */

export interface PlacedOccurrence {
  occ: Occurrence;
  /** minutos desde 00:00 do dia */
  top: number;
  height: number;
  column: number;
  columns: number;
}

const MIN_HEIGHT_MIN = 25;

/** Posiciona as ocorrências de um dia, dividindo em colunas quando se sobrepõem */
export const layoutDay = (occurrences: Occurrence[], day: Date): PlacedOccurrence[] => {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  const items = occurrences
    .map((occ) => {
      const s = Math.max(occ.start.getTime(), dayStart);
      const e = Math.min(occ.end.getTime(), dayEnd);
      const top = (s - dayStart) / 60000;
      const height = Math.max((e - s) / 60000, MIN_HEIGHT_MIN);
      return { occ, top, height, column: 0, columns: 1 };
    })
    .sort((a, b) => a.top - b.top || b.height - a.height);

  let cluster: typeof items = [];
  let clusterEnd = -Infinity;
  const flush = () => {
    const columnEnds: number[] = [];
    for (const item of cluster) {
      let col = columnEnds.findIndex((end) => end <= item.top);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(0);
      }
      columnEnds[col] = item.top + item.height;
      item.column = col;
    }
    for (const item of cluster) item.columns = columnEnds.length;
    cluster = [];
  };

  for (const item of items) {
    if (cluster.length && item.top >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.top + item.height);
  }
  if (cluster.length) flush();

  return items;
};

/* ------------------------------------------------------------------ persistência */

interface StoredEvent extends Omit<CalendarEvent, "start" | "end"> {
  start: string;
  end: string;
}

export const serializeEvents = (events: CalendarEvent[]): string =>
  JSON.stringify(
    events.map<StoredEvent>((e) => ({ ...e, start: e.start.toISOString(), end: e.end.toISOString() }))
  );

const isCategory = (v: unknown): v is EventCategory => typeof v === "string" && v in CATEGORIES;
const isRepeat = (v: unknown): v is RepeatRule => v === "none" || v === "daily" || v === "weekly" || v === "monthly";
const validDate = (v: unknown): Date | null => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Converte um item salvo (formato atual ou o antigo com `date`/`endDate`) em evento; null se inválido */
export const parseEvent = (raw: unknown): CalendarEvent | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const start = validDate(r.start ?? r.date);
  if (!start || typeof r.title !== "string" || !r.title.trim()) return null;
  let end = validDate(r.end ?? r.endDate);
  if (!end || end <= start) end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    id: typeof r.id === "string" && r.id ? r.id : newId(),
    title: r.title.trim().slice(0, 120),
    description: typeof r.description === "string" ? r.description.slice(0, 2000) : "",
    start,
    end,
    category: isCategory(r.category) ? r.category : "other",
    completed: r.completed === true,
    reminder: typeof r.reminder === "number" && r.reminder >= 0 ? r.reminder : null,
    repeat: isRepeat(r.repeat) ? r.repeat : "none",
  };
};

export const parseEvents = (text: string): CalendarEvent[] | null => {
  try {
    const data: unknown = JSON.parse(text);
    // aceita tanto a lista direta quanto { events: [...] } (backup exportado)
    const list = Array.isArray(data) ? data : (data as { events?: unknown })?.events;
    if (!Array.isArray(list)) return null;
    return list.map(parseEvent).filter((e): e is CalendarEvent => e !== null);
  } catch {
    return null;
  }
};

/* ------------------------------------------------------------------ exportação .ics */

const pad = (n: number) => String(n).padStart(2, "0");
const icsDate = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes()
  )}${pad(d.getUTCSeconds())}Z`;

const icsEscape = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Dobra linhas longas (limite de 75 caracteres do formato iCalendar) */
const fold = (line: string): string => {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  parts.push(rest);
  return parts.join("\r\n");
};

const RRULE: Record<RepeatRule, string | null> = {
  none: null,
  daily: "FREQ=DAILY",
  weekly: "FREQ=WEEKLY",
  monthly: "FREQ=MONTHLY",
};

export const toICS = (events: CalendarEvent[], now: Date = new Date()): string => {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shadow Calendar//PT-BR//", "CALSCALE:GREGORIAN"];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@shadow-calendar`,
      `DTSTAMP:${icsDate(now)}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(e.end)}`,
      `SUMMARY:${icsEscape(e.title)}`
    );
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    lines.push(`CATEGORIES:${icsEscape(CATEGORIES[e.category].label)}`);
    const rrule = RRULE[e.repeat];
    if (rrule) lines.push(`RRULE:${rrule}`);
    if (e.completed) lines.push("STATUS:CONFIRMED");
    if (e.reminder !== null) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(e.title)}`,
        `TRIGGER:-PT${e.reminder}M`,
        "END:VALARM"
      );
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
};

/* ------------------------------------------------------------------ exemplos */

export const sampleEvents = (today: Date = new Date()): CalendarEvent[] => {
  const at = (offsetDays: number, hour: number, minute = 0) => {
    const d = addDays(startOfDay(today), offsetDays);
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  const make = (
    title: string,
    description: string,
    start: Date,
    minutes: number,
    category: EventCategory,
    extra: Partial<CalendarEvent> = {}
  ): CalendarEvent => ({
    id: newId(),
    title,
    description,
    start,
    end: new Date(start.getTime() + minutes * 60000),
    category,
    completed: false,
    reminder: null,
    repeat: "none",
    ...extra,
  });
  return [
    make("Reunião de equipe", "Alinhamento semanal", at(0, 10), 60, "meeting", { repeat: "weekly", reminder: 15 }),
    make("Consulta médica", "Check-up anual", at(2, 15), 45, "health", { reminder: 60 }),
    make("Entrega do relatório", "Enviar a versão final", at(5, 17), 30, "work", { reminder: 1440 }),
    make("Treino", "Academia", at(0, 18, 30), 90, "health", { repeat: "daily" }),
    make("Mercado", "Compras da semana", at(-1, 19), 60, "personal", { completed: true }),
  ];
};
