
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/contexts/EventContext";
import CalendarHeader from "./calendar/CalendarHeader";
import MonthView from "./calendar/MonthView";
import WeekView from "./calendar/WeekView";
import DayView from "./calendar/DayView";
import EventForm from "./calendar/EventForm";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedView } = useEvents();
  
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);

  const handleAddEvent = () => {
    setSelectedEventId(undefined);
    setIsEventFormOpen(true);
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsEventFormOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Minimal Calendar</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center mr-2">
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm">{user?.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <CalendarHeader onOpenAddEvent={handleAddEvent} />
          
          <div className="mt-4">
            {selectedView === "month" && (
              <MonthView onEventClick={handleEventClick} />
            )}
            {selectedView === "week" && (
              <WeekView onEventClick={handleEventClick} />
            )}
            {selectedView === "day" && (
              <DayView onEventClick={handleEventClick} />
            )}
          </div>
        </div>
      </main>
      
      <EventForm
        isOpen={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        eventId={selectedEventId}
      />
    </div>
  );
};

export default Dashboard;
