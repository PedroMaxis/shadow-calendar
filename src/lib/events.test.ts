import { describe, expect, it } from "vitest";
import {
  expandEvents,
  layoutDay,
  occurrencesOnDay,
  parseEvent,
  parseEvents,
  sampleEvents,
  serializeEvents,
  toICS,
  type CalendarEvent,
} from "./events";
import { periodTitle } from "./format";

const at = (iso: string) => new Date(iso);

const ev = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "e1",
  title: "Reunião",
  description: "",
  start: at("2025-03-10T10:00:00"),
  end: at("2025-03-10T11:00:00"),
  category: "meeting",
  completed: false,
  reminder: null,
  repeat: "none",
  ...over,
});

describe("expandEvents", () => {
  it("evento simples aparece só no intervalo em que acontece", () => {
    const events = [ev()];
    expect(expandEvents(events, at("2025-03-10T00:00:00"), at("2025-03-10T23:59:59"))).toHaveLength(1);
    expect(expandEvents(events, at("2025-03-11T00:00:00"), at("2025-03-11T23:59:59"))).toHaveLength(0);
  });

  it("repetição diária gera uma ocorrência por dia, mantendo o horário e a duração", () => {
    const occs = expandEvents([ev({ repeat: "daily" })], at("2025-03-10T00:00:00"), at("2025-03-14T23:59:59"));
    expect(occs).toHaveLength(5);
    expect(occs[4].start.getDate()).toBe(14);
    expect(occs[4].end.getTime() - occs[4].start.getTime()).toBe(3_600_000);
  });

  it("repetição semanal cai sempre no mesmo dia da semana", () => {
    const occs = expandEvents([ev({ repeat: "weekly" })], at("2025-03-01T00:00:00"), at("2025-04-30T23:59:59"));
    expect(occs.every((o) => o.start.getDay() === 1)).toBe(true); // segunda
    expect(occs[0].start.getDate()).toBe(10);
    expect(occs).toHaveLength(8);
  });

  it("repetição mensal em dia 31 não pula meses curtos", () => {
    const occs = expandEvents(
      [ev({ repeat: "monthly", start: at("2025-01-31T09:00:00"), end: at("2025-01-31T10:00:00") })],
      at("2025-01-01T00:00:00"),
      at("2025-04-30T23:59:59")
    );
    expect(occs.map((o) => o.start.getMonth())).toEqual([0, 1, 2, 3]);
    expect(occs[1].start.getDate()).toBe(28); // fevereiro
  });

  it("não ocorre antes da data de início do evento recorrente", () => {
    const occs = expandEvents([ev({ repeat: "daily" })], at("2025-03-01T00:00:00"), at("2025-03-09T23:59:59"));
    expect(occs).toHaveLength(0);
  });

  it("consegue chegar em datas muito distantes sem iterar anos de repetições", () => {
    const old = ev({ repeat: "daily", start: at("2015-01-01T08:00:00"), end: at("2015-01-01T09:00:00") });
    const occs = occurrencesOnDay([old], at("2025-06-15T12:00:00"));
    expect(occs).toHaveLength(1);
    expect(occs[0].start.getFullYear()).toBe(2025);
  });
});

describe("layoutDay", () => {
  const occ = (id: string, s: string, e: string) => ({
    event: ev({ id }),
    start: at(s),
    end: at(e),
    key: id,
  });
  const day = at("2025-03-10T12:00:00");

  it("eventos sem sobreposição ocupam a largura toda", () => {
    const placed = layoutDay([occ("a", "2025-03-10T09:00:00", "2025-03-10T10:00:00"), occ("b", "2025-03-10T10:00:00", "2025-03-10T11:00:00")], day);
    expect(placed.map((p) => p.columns)).toEqual([1, 1]);
  });

  it("eventos sobrepostos dividem o espaço em colunas", () => {
    const placed = layoutDay([occ("a", "2025-03-10T09:00:00", "2025-03-10T11:00:00"), occ("b", "2025-03-10T10:00:00", "2025-03-10T12:00:00")], day);
    expect(placed.map((p) => p.columns)).toEqual([2, 2]);
    expect(new Set(placed.map((p) => p.column)).size).toBe(2);
  });

  it("posiciona pelo minuto do dia e garante altura mínima", () => {
    const [p] = layoutDay([occ("a", "2025-03-10T09:30:00", "2025-03-10T09:35:00")], day);
    expect(p.top).toBe(9 * 60 + 30);
    expect(p.height).toBeGreaterThanOrEqual(25);
  });

  it("evento que atravessa a meia-noite é cortado no dia", () => {
    const [p] = layoutDay([occ("a", "2025-03-10T23:00:00", "2025-03-11T02:00:00")], day);
    expect(p.top + p.height).toBeLessThanOrEqual(24 * 60);
  });
});

describe("armazenamento", () => {
  it("salvar e carregar devolve os mesmos eventos (com datas reais)", () => {
    const original = [ev({ reminder: 15, repeat: "weekly" })];
    const back = parseEvents(serializeEvents(original));
    expect(back).toHaveLength(1);
    expect(back![0].start).toBeInstanceOf(Date);
    expect(back![0].start.getTime()).toBe(original[0].start.getTime());
    expect(back![0].reminder).toBe(15);
    expect(back![0].repeat).toBe("weekly");
  });

  it("migra o formato antigo (date/endDate, sem duração)", () => {
    const legacy = { id: "1", title: "Consulta", description: "", date: "2025-03-10T10:00:00.000Z", category: "health", completed: true, userId: "1" };
    const e = parseEvent(legacy)!;
    expect(e.start.toISOString()).toBe("2025-03-10T10:00:00.000Z");
    expect(e.end.getTime() - e.start.getTime()).toBe(3_600_000); // 1h padrão
    expect(e.completed).toBe(true);
    expect(e.repeat).toBe("none");
  });

  it("descarta itens inválidos e corrige valores estranhos", () => {
    expect(parseEvent(null)).toBeNull();
    expect(parseEvent({ title: "", start: "2025-01-01" })).toBeNull();
    expect(parseEvent({ title: "x", start: "não é data" })).toBeNull();
    const e = parseEvent({ title: "x", start: "2025-01-01T10:00:00", end: "2025-01-01T09:00:00", category: "???", repeat: "yearly" })!;
    expect(e.end > e.start).toBe(true);
    expect(e.category).toBe("other");
    expect(e.repeat).toBe("none");
  });

  it("rejeita JSON inválido e aceita backup no formato { events }", () => {
    expect(parseEvents("isso não é json")).toBeNull();
    expect(parseEvents('{"foo":1}')).toBeNull();
    expect(parseEvents(JSON.stringify({ events: [{ title: "a", start: "2025-01-01T10:00:00" }] }))).toHaveLength(1);
  });
});

describe("toICS", () => {
  const now = at("2025-03-01T12:00:00Z");

  it("gera um calendário válido com os campos principais", () => {
    const ics = toICS([ev({ id: "abc", title: "Dentista", start: at("2025-03-10T13:00:00Z"), end: at("2025-03-10T14:00:00Z") })], now);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("UID:abc@shadow-calendar");
    expect(ics).toContain("DTSTART:20250310T130000Z");
    expect(ics).toContain("DTEND:20250310T140000Z");
    expect(ics).toContain("SUMMARY:Dentista");
  });

  it("escapa vírgula, ponto e vírgula, barra e quebra de linha", () => {
    const ics = toICS([ev({ title: "A, B; C\\D", description: "linha1\nlinha2" })], now);
    expect(ics).toContain("SUMMARY:A\\, B\\; C\\\\D");
    expect(ics).toContain("DESCRIPTION:linha1\\nlinha2");
  });

  it("inclui recorrência e lembrete", () => {
    const ics = toICS([ev({ repeat: "weekly", reminder: 15 })], now);
    expect(ics).toContain("RRULE:FREQ=WEEKLY");
    expect(ics).toContain("TRIGGER:-PT15M");
  });

  it("dobra linhas longas em 75 caracteres", () => {
    const ics = toICS([ev({ description: "x".repeat(300) })], now);
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
  });
});

describe("outros", () => {
  it("eventos de exemplo são válidos", () => {
    const samples = sampleEvents(at("2025-03-10T12:00:00"));
    expect(samples.length).toBeGreaterThan(0);
    for (const s of samples) expect(s.end > s.start).toBe(true);
  });

  it("título do período em português", () => {
    const d = at("2025-10-31T12:00:00");
    expect(periodTitle("month", d)).toBe("Outubro de 2025");
    expect(periodTitle("day", d)).toBe("Sexta-feira, 31 de outubro de 2025");
    expect(periodTitle("week", d)).toContain("out");
  });
});
