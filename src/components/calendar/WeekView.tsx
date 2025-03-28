
import React from "react";
import { useEvents } from "@/contexts/EventContext";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addHours,
} from "date-fns";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  onEventClick: (eventId: string) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ onEventClick }) => {
  const { events, selectedDate, filteredEvents, activeFilter } = useEvents();
  
  const activeEvents = filteredEvents(activeFilter);
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // 0 = Sunday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Create hour labels for the time column (24-hour format)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return activeEvents.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, day) && eventDate.getHours() === hour;
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work':
        return 'bg-blue-500';
      case 'personal':
        return 'bg-green-500';
      case 'health':
        return 'bg-red-500';
      case 'meeting':
        return 'bg-yellow-500';
      case 'other':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <div className="flex">
        {/* Time column */}
        <div className="w-16 flex-none border-r border-border">
          <div className="h-12 border-b border-border"></div> {/* Header space */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b border-border px-2 py-1 text-xs"
            >
              {format(addHours(new Date().setHours(0, 0, 0, 0), hour), "h a")}
            </div>
          ))}
        </div>
        
        {/* Days columns */}
        <div className="flex flex-1">
          {days.map((day) => (
            <div key={day.toString()} className="flex-1 border-r border-border last:border-r-0">
              {/* Day header */}
              <div
                className={cn(
                  "h-12 border-b border-border p-2 text-center",
                  isToday(day) && "bg-primary/10 font-bold"
                )}
              >
                <div className="text-sm">{format(day, "EEE")}</div>
                <div
                  className={cn(
                    "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-sm",
                    isToday(day) && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
              
              {/* Hour cells */}
              {hours.map((hour) => {
                const eventsAtHour = getEventsForDayAndHour(day, hour);
                
                return (
                  <div
                    key={hour}
                    className="h-16 border-b border-border p-1"
                  >
                    {eventsAtHour.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event.id)}
                        className={cn(
                          "mb-1 cursor-pointer rounded px-1 py-0.5 text-xs transition-colors",
                          event.completed ? "line-through opacity-50" : "",
                          getCategoryColor(event.category)
                        )}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
