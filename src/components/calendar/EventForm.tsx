import { useState } from "react";
import { addMinutes, differenceInMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIES,
  CATEGORY_ORDER,
  REMINDER_OPTIONS,
  REPEAT_LABELS,
  type CalendarEvent,
  type EventCategory,
  type RepeatRule,
} from "@/lib/events";
import { useEvents } from "@/contexts/event-context";

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Evento em edição; vazio = novo evento */
  eventId?: string;
  /** Data/hora de início sugerida para um novo evento */
  defaultStart?: Date;
}

const toTime = (d: Date) => format(d, "HH:mm");
const withTime = (day: Date, time: string): Date => {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
};

const FormBody = ({ eventId, defaultStart, onClose }: { eventId?: string; defaultStart?: Date; onClose: () => void }) => {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const editing = eventId ? events.find((e) => e.id === eventId) : undefined;

  const initialStart = editing?.start ?? defaultStart ?? new Date();
  const initialEnd = editing?.end ?? addMinutes(initialStart, 60);

  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [day, setDay] = useState<Date>(initialStart);
  const [startTime, setStartTime] = useState(toTime(initialStart));
  const [endTime, setEndTime] = useState(toTime(initialEnd));
  const [category, setCategory] = useState<EventCategory>(editing?.category ?? "personal");
  const [reminder, setReminder] = useState<number | null>(editing?.reminder ?? null);
  const [repeat, setRepeat] = useState<RepeatRule>(editing?.repeat ?? "none");
  const [completed, setCompleted] = useState(editing?.completed ?? false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ao mudar o início, mantém a duração do evento
  const changeStart = (value: string) => {
    const duration = Math.max(15, differenceInMinutes(withTime(day, endTime), withTime(day, startTime)));
    setStartTime(value);
    if (value) setEndTime(toTime(addMinutes(withTime(day, value), duration)));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = withTime(day, startTime);
    const end = withTime(day, endTime);
    if (end <= start) {
      setError("O horário final precisa ser depois do inicial.");
      return;
    }
    const data: Omit<CalendarEvent, "id"> = {
      title: title.trim(),
      description: description.trim(),
      start,
      end,
      category,
      reminder,
      repeat,
      completed: repeat === "none" ? completed : false,
    };
    if (editing) updateEvent(editing.id, data);
    else addEvent(data);
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ev-title">Título</Label>
        <Input
          id="ev-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Dentista"
          maxLength={120}
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-1">
          <Label>Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start font-normal">
                <CalendarIcon className="h-4 w-4" />
                {format(day, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={day} onSelect={(d) => d && setDay(d)} locale={ptBR} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-start">Início</Label>
          <Input id="ev-start" type="time" value={startTime} onChange={(e) => changeStart(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-end">Fim</Label>
          <Input
            id="ev-end"
            type="time"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              setError(null);
            }}
            required
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ev-category">Categoria</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
            <SelectTrigger id="ev-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_ORDER.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${CATEGORIES[c].dot}`} />
                    {CATEGORIES[c].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-repeat">Repetição</Label>
          <Select value={repeat} onValueChange={(v) => setRepeat(v as RepeatRule)}>
            <SelectTrigger id="ev-repeat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(REPEAT_LABELS) as RepeatRule[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {REPEAT_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-reminder">Lembrete</Label>
        <Select
          value={reminder === null ? "none" : String(reminder)}
          onValueChange={(v) => setReminder(v === "none" ? null : Number(v))}
        >
          <SelectTrigger id="ev-reminder">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REMINDER_OPTIONS.map((o) => (
              <SelectItem key={String(o.value)} value={o.value === null ? "none" : String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-desc">Descrição</Label>
        <Textarea
          id="ev-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes, local, link da reunião..."
          rows={3}
          maxLength={2000}
        />
      </div>

      {editing && repeat === "none" && (
        <div className="flex items-center gap-2">
          <Checkbox id="ev-done" checked={completed} onCheckedChange={(c) => setCompleted(c === true)} />
          <Label htmlFor="ev-done">Marcar como concluído</Label>
        </div>
      )}

      <DialogFooter className="gap-2 sm:justify-between">
        {editing ? (
          confirmDelete ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  deleteEvent(editing.id);
                  onClose();
                }}
              >
                Confirmar exclusão
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Voltar
              </Button>
            </div>
          ) : (
            <Button type="button" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          )
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{editing ? "Salvar" : "Criar evento"}</Button>
        </div>
      </DialogFooter>
    </form>
  );
};

const EventForm = ({ open, onOpenChange, eventId, defaultStart }: EventFormProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{eventId ? "Editar evento" : "Novo evento"}</DialogTitle>
        <DialogDescription>
          {eventId ? "Altere os dados do evento." : "Preencha os dados para adicionar à sua agenda."}
        </DialogDescription>
      </DialogHeader>
      {open && <FormBody eventId={eventId} defaultStart={defaultStart} onClose={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
);

export default EventForm;
