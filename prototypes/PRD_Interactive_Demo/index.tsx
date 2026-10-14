import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { HouseDemo } from "./HouseDemo";
import "./proto.css";

/* Interactive demo for the product page. No app shell — it stands on its own,
   the way it would be embedded in a marketing page. */

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto mb-4 flex w-full max-w-6xl justify-end">
          <ThemeToggle />
        </div>
        <HouseDemo />
      </div>
    </ThemeProvider>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<App />);
