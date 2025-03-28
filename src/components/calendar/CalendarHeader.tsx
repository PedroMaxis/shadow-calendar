
import { Button } from "@/components/ui/button";
import { useEvents } from "@/contexts/EventContext";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface CalendarHeaderProps {
  onOpenAddEvent: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ onOpenAddEvent }) => {
  const {
    selectedDate,
    setSelectedDate,
    selectedView,
    setSelectedView,
    activeFilter,
    setActiveFilter,
  } = useEvents();
  
  const isMobile = useIsMobile();

  const navigatePrevious = () => {
    switch (selectedView) {
      case "day":
        setSelectedDate(subDays(selectedDate, 1));
        break;
      case "week":
        setSelectedDate(subWeeks(selectedDate, 1));
        break;
      case "month":
        setSelectedDate(subMonths(selectedDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (selectedView) {
      case "day":
        setSelectedDate(addDays(selectedDate, 1));
        break;
      case "week":
        setSelectedDate(addWeeks(selectedDate, 1));
        break;
      case "month":
        setSelectedDate(addMonths(selectedDate, 1));
        break;
    }
  };

  const navigateToday = () => {
    setSelectedDate(new Date());
  };

  const getHeaderTitle = () => {
    switch (selectedView) {
      case "day":
        return format(selectedDate, "EEEE, MMMM d, yyyy");
      case "week":
        return `Week of ${format(selectedDate, "MMMM d, yyyy")}`;
      case "month":
        return format(selectedDate, "MMMM yyyy");
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={navigateToday} className="ml-2">
            Today
          </Button>
          <h1 className="text-xl font-semibold ml-4">{getHeaderTitle()}</h1>
        </div>
        <Button size={isMobile ? "icon" : "default"} onClick={onOpenAddEvent}>
          {isMobile ? <Plus className="h-4 w-4" /> : "Add Event"}
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2 md:items-center justify-between">
        <div className="flex gap-2">
          <Select
            value={selectedView}
            onValueChange={(value) => setSelectedView(value as "day" | "week" | "month")}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value as any)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
