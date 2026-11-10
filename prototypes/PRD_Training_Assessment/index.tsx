import { createRoot } from "react-dom/client";
import lofiHtml from "./lofi.html?raw";
import "./proto.css";

/* The page is the lo-fi prototype itself, full screen. It runs in an iframe so its
   own styles and hash routing stay separate from the app theme. */
const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${lofiHtml}</body></html>`;

const el = document.getElementById("root");
if (el) createRoot(el).render(<iframe title="Training Assessment lo-fi prototype" srcDoc={doc} className="block h-svh w-full border-0 bg-background" />);
