import { useRef, useState } from "react";
import { addDays, addMonths, addWeeks, subDays, subMonths, subWeeks } from "date-fns";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileUp,
  MoreHorizontal,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { periodTitle } from "@/lib/format";
import { CATEGORIES, CATEGORY_ORDER, parseEvents, serializeEvents, toICS } from "@/lib/events";
import { useEvents, type CalendarView } from "@/contexts/event-context";

interface CalendarToolbarProps {
  onNewEvent: () => void;
  searchRef: React.RefObject<HTMLInputElement>;
}

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
];

const download = (filename: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const CalendarToolbar = ({ onNewEvent, searchRef }: CalendarToolbarProps) => {
  const { events, selectedDate, setSelectedDate, view, setView, filter, setFilter, query, setQuery, importEvents, loadSamples, clearAll } =
    useEvents();
  const { resolvedTheme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );

  const step = (dir: 1 | -1) => {
    const fn = view === "day" ? (dir === 1 ? addDays : subDays) : view === "week" ? (dir === 1 ? addWeeks : subWeeks) : dir === 1 ? addMonths : subMonths;
    setSelectedDate(fn(selectedDate, 1));
  };

  const enableNotifications = async () => {
    if (permission === "unsupported") return toast.error("Este navegador não suporta notificações.");
    if (permission === "denied")
      return toast.error("As notificações estão bloqueadas. Libere nas configurações do site no navegador.");
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") toast.success("Notificações ativadas: você será avisado dos lembretes.");
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    const list = parseEvents(await file.text());
    if (!list) toast.error("Arquivo inválido: use um backup exportado pelo Shadow Calendar.");
    else {
      const added = importEvents(list);
      toast.success(added ? `${added} evento(s) importado(s)` : "Nenhum evento novo no arquivo");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const dark = resolvedTheme === "dark";

  return (
    <header className="mb-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Shadow Calendar</h1>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar  ( / )"
              aria-label="Buscar eventos"
              className="h-9 w-48 pl-8 lg:w-64"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={enableNotifications}
            aria-label={permission === "granted" ? "Notificações ativadas" : "Ativar notificações"}
            title={permission === "granted" ? "Notificações ativadas" : "Ativar notificações dos lembretes"}
          >
            {permission === "granted" ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais opções">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Seus dados ({events.length} eventos)</DropdownMenuLabel>
              <DropdownMenuItem
                disabled={!events.length}
                onSelect={() => download("shadow-calendar.ics", toICS(events), "text/calendar")}
              >
                <Download className="h-4 w-4" /> Exportar agenda (.ics)
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!events.length}
                onSelect={() => download("shadow-calendar-backup.json", serializeEvents(events), "application/json")}
              >
                <Download className="h-4 w-4" /> Exportar backup (.json)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
                <FileUp className="h-4 w-4" /> Importar backup
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={loadSamples}>
                <Sparkles className="h-4 w-4" /> Adicionar eventos de exemplo
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!events.length}
                className="text-destructive focus:text-destructive"
                onSelect={() => window.confirm("Apagar todos os eventos? Dá para desfazer logo em seguida.") && clearAll()}
              >
                <Trash2 className="h-4 w-4" /> Apagar todos os eventos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => handleImport(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label="Período anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => step(1)} aria-label="Próximo período">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setSelectedDate(new Date())} className="ml-1">
            Hoje
          </Button>
          <h2 className="ml-3 text-xl font-semibold tracking-tight" aria-live="polite">
            {periodTitle(view, selectedDate)}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div role="group" aria-label="Visualização" className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setView(v.value)}
                aria-pressed={view === v.value}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  view === v.value ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <Button onClick={onNewEvent}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo evento</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:hidden">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar eventos"
            aria-label="Buscar eventos"
            className="h-9 pl-8"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            filter === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
          )}
        >
          Todas
        </button>
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(filter === c ? "all" : c)}
            aria-pressed={filter === c}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
              filter === c ? "border-primary bg-accent" : "border-border hover:bg-accent"
            )}
          >
            <span className={cn("h-2 w-2 rounded-full", CATEGORIES[c].dot)} />
            {CATEGORIES[c].label}
          </button>
        ))}
      </div>
    </header>
  );
};

export default CalendarToolbar;
