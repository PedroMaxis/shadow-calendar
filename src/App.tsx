import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { EventProvider } from "@/contexts/EventProvider";
import CalendarPage from "@/components/calendar/CalendarPage";

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <EventProvider>
      <CalendarPage />
      <Toaster position="bottom-right" />
    </EventProvider>
  </ThemeProvider>
);

export default App;
