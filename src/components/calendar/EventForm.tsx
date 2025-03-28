
import { useState, useEffect } from "react";
import { useEvents, Event, EventCategory } from "@/contexts/EventContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Trash2 } from "lucide-react";

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
}

const EventForm: React.FC<EventFormProps> = ({ isOpen, onClose, eventId }) => {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("12:00");
  const [category, setCategory] = useState<EventCategory>("other");
  const [completed, setCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (eventId) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setTitle(event.title);
        setDescription(event.description || "");
        setDate(new Date(event.date));
        setTime(format(new Date(event.date), "HH:mm"));
        setCategory(event.category);
        setCompleted(event.completed);
        setIsEditing(true);
      }
    } else {
      resetForm();
      setIsEditing(false);
    }
  }, [eventId, events]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(new Date());
    setTime("12:00");
    setCategory("other");
    setCompleted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse time and create a full date with time
    const [hours, minutes] = time.split(":").map(Number);
    const fullDate = new Date(date);
    fullDate.setHours(hours, minutes, 0, 0);
    
    const eventData = {
      title,
      description,
      date: fullDate,
      category,
      completed,
    };
    
    if (isEditing && eventId) {
      updateEvent(eventId, eventData);
    } else {
      addEvent(eventData);
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (isEditing && eventId) {
      deleteEvent(eventId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as EventCategory)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="completed"
                checked={completed}
                onCheckedChange={(checked) => setCompleted(checked as boolean)}
              />
              <Label htmlFor="completed">Mark as completed</Label>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <div>
              <Button type="button" variant="outline" onClick={onClose} className="mr-2">
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Update" : "Add"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventForm;
