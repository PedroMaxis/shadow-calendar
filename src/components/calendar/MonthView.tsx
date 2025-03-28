
import React from "react";
import { useEvents } from "@/contexts/EventContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
  getDay,
  addDays,
  subDays,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MonthViewProps {
  onEventClick: (eventId: string) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ onEventClick }) => {
  const { events, selectedDate, filteredEvents, activeFilter, setSelectedDate } = useEvents();
  
  const activeEvents = filteredEvents(activeFilter);
  
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate days needed before the start of the month to fill the calendar grid
  const dayOfWeekStart = getDay(monthStart);
  const prefixDays = Array.from({ length: dayOfWeekStart }).map((_, i) => 
    subDays(monthStart, dayOfWeekStart - i)
  ).reverse();
  
  // Calculate days needed after the end of the month to fill the calendar grid
  const lastDay = days[days.length - 1];
  const dayOfWeekEnd = getDay(lastDay);
  const suffixDays = Array.from({ length: 6 - dayOfWeekEnd }).map((_, i) => 
    addDays(lastDay, i + 1)
  );
  
  const allDays = [...prefixDays, ...days, ...suffixDays];
  
  // Split days into weeks
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  
  const getEventsForDay = (day: Date) => {
    return activeEvents.filter(event => isSameDay(new Date(event.date), day));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
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
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 bg-secondary">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium"
          >
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 border-t border-border">
        {weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[100px] border-r border-b border-border p-1 transition-colors",
                    !isCurrentMonth && "bg-muted/50 text-muted-foreground",
                    isSelected && "bg-accent",
                    isToday(day) && "font-bold"
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex justify-between">
                    <span className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-sm",
                      isToday(day) && "bg-primary text-primary-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="inline-flex items-center justify-center rounded bg-primary/10 px-1 text-xs">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event.id);
                        }}
                        className={cn(
                          "text-xs px-1 py-0.5 truncate rounded cursor-pointer transition-colors",
                          event.completed ? "line-through opacity-50" : "",
                          getCategoryColor(event.category)
                        )}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default MonthView;
