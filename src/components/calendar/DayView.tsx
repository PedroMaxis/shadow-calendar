
import React from "react";
import { useEvents } from "@/contexts/EventContext";
import { format, addHours } from "date-fns";
import { cn } from "@/lib/utils";

interface DayViewProps {
  onEventClick: (eventId: string) => void;
}

const DayView: React.FC<DayViewProps> = ({ onEventClick }) => {
  const { events, selectedDate, filteredEvents, activeFilter } = useEvents();
  
  const activeEvents = filteredEvents(activeFilter);
  
  // Create hour labels for the time column (24-hour format)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getEventsForHour = (hour: number) => {
    return activeEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getHours() === hour;
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
        
        {/* Day column */}
        <div className="flex-1">
          {/* Day header */}
          <div className="h-12 border-b border-border p-2 text-center">
            <div className="text-sm font-medium">{format(selectedDate, "EEEE")}</div>
            <div className="text-sm">{format(selectedDate, "MMMM d, yyyy")}</div>
          </div>
          
          {/* Hour cells */}
          {hours.map((hour) => {
            const eventsAtHour = getEventsForHour(hour);
            
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
                      "mb-1 cursor-pointer rounded px-2 py-1 text-xs transition-colors",
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
      </div>
    </div>
  );
};

export default DayView;
