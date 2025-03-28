
import React, { createContext, useState, useContext, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "./AuthContext";
import { addDays, subDays } from "date-fns";

export type EventCategory = "work" | "personal" | "health" | "meeting" | "other";

export type Event = {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  completed: boolean;
  category: EventCategory;
  userId: string;
};

type EventContextType = {
  events: Event[];
  addEvent: (event: Omit<Event, "id" | "userId">) => void;
  updateEvent: (id: string, event: Partial<Omit<Event, "id" | "userId">>) => void;
  deleteEvent: (id: string) => void;
  toggleEventCompletion: (id: string) => void;
  filteredEvents: (filter: EventCategory | "all") => Event[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedView: "day" | "week" | "month";
  setSelectedView: (view: "day" | "week" | "month") => void;
  activeFilter: EventCategory | "all";
  setActiveFilter: (filter: EventCategory | "all") => void;
};

const EventContext = createContext<EventContextType | undefined>(undefined);

// Mock event data
const generateMockEvents = (userId: string): Event[] => {
  const today = new Date();
  
  return [
    {
      id: "1",
      title: "Team Meeting",
      description: "Weekly team sync meeting",
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      completed: false,
      category: "meeting",
      userId,
    },
    {
      id: "2",
      title: "Doctor Appointment",
      description: "Annual checkup",
      date: addDays(today, 2),
      completed: false,
      category: "health",
      userId,
    },
    {
      id: "3",
      title: "Project Deadline",
      description: "Submit final project report",
      date: addDays(today, 5),
      completed: false,
      category: "work",
      userId,
    },
    {
      id: "4",
      title: "Grocery Shopping",
      description: "Buy groceries for the week",
      date: subDays(today, 1),
      completed: true,
      category: "personal",
      userId,
    },
  ];
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedView, setSelectedView] = useState<"day" | "week" | "month">("month");
  const [activeFilter, setActiveFilter] = useState<EventCategory | "all">("all");

  useEffect(() => {
    if (user) {
      // Load events from localStorage
      const savedEvents = localStorage.getItem(`events-${user.id}`);
      if (savedEvents) {
        setEvents(
          JSON.parse(savedEvents).map((event: any) => ({
            ...event,
            date: new Date(event.date),
            endDate: event.endDate ? new Date(event.endDate) : undefined,
          }))
        );
      } else {
        // Use mock data if no saved events
        setEvents(generateMockEvents(user.id));
      }
    } else {
      setEvents([]);
    }
  }, [user]);

  useEffect(() => {
    // Save events to localStorage whenever they change
    if (user) {
      localStorage.setItem(`events-${user.id}`, JSON.stringify(events));
    }
  }, [events, user]);

  const addEvent = (event: Omit<Event, "id" | "userId">) => {
    if (!user) return;

    const newEvent: Event = {
      ...event,
      id: Date.now().toString(),
      userId: user.id,
    };

    setEvents((prevEvents) => [...prevEvents, newEvent]);
    toast({
      title: "Event Added",
      description: "Your event has been added to the calendar",
    });
  };

  const updateEvent = (id: string, eventUpdate: Partial<Omit<Event, "id" | "userId">>) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === id ? { ...event, ...eventUpdate } : event
      )
    );
    toast({
      title: "Event Updated",
      description: "Your event has been updated",
    });
  };

  const deleteEvent = (id: string) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
    toast({
      title: "Event Deleted",
      description: "Your event has been removed from the calendar",
    });
  };

  const toggleEventCompletion = (id: string) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === id ? { ...event, completed: !event.completed } : event
      )
    );
    toast({
      title: "Event Status Updated",
      description: "Event completion status updated",
    });
  };

  const filteredEvents = (filter: EventCategory | "all") => {
    return filter === "all"
      ? events
      : events.filter((event) => event.category === filter);
  };

  return (
    <EventContext.Provider
      value={{
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        toggleEventCompletion,
        filteredEvents,
        selectedDate,
        setSelectedDate,
        selectedView,
        setSelectedView,
        activeFilter,
        setActiveFilter,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvents must be used within an EventProvider");
  }
  return context;
};
