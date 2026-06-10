import React from "react";
import { createRoot } from "react-dom/client";

// Vite glob — auto-discovers all prototype index.tsx files
const modules = import.meta.glob("./**/index.tsx");

const slugs = Object.keys(modules)
  .map((path) => path.replace(/^\.\//, "").replace(/\/index\.tsx$/, ""))
  .filter(Boolean);

function PrototypeIndex() {
  return (
    <div>
      {slugs.length === 0 ? (
        <p className="empty">No prototypes yet. Run the prototype skill to create one.</p>
      ) : (
        <ul>
          {slugs.map((slug) => (
            <li key={slug}>
              <a href={`/${slug}/`}>
                {slug}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<PrototypeIndex />);
