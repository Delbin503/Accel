# Delbin Accel UI — AI Coding Rules

This is a **pure frontend component showcase**. No API calls, no backend integration. Components built here are designed to be copy-pasted into `trms-accel-fe`. Every piece of code you generate must follow these rules exactly so components drop into the target project without modification.

---

## Project Purpose

- Delbin (designer) builds UI components using vibe coding
- Developers copy finished components into `trms-accel-fe`
- Components must match `trms-accel-fe` structure, tokens, and patterns exactly
- No data fetching, no backend calls — use hardcoded mock data for demos

---

## Tech Stack

| Tool | Version | Notes |
|------|---------|-------|
| React | 18.3.1 | CRA (Create React App), NOT Next.js |
| React Router DOM | 6.16.0 | Page navigation within the showcase |
| Tailwind CSS | 3.3.3 | Only styling method — no raw hex, no inline styles |
| clsx | 2.1.1 | Conditional className |
| tailwind-merge | 3.4.0 | Merge Tailwind classes safely |
| Day.js | 1.11.10 | Date display in components |
| Recharts | 3.5.1 | Chart components |
| React Select | 5.10.2 | Dropdown/select components |
| React Toastify | 11.0.5 | Toast notification components |
| Prop-types | 15.8.1 | Runtime prop validation |

**No TypeScript. No API calls. No state management libraries.** Use `useState` and `useReducer` for local component state only.

---

## Folder Structure

```
src/
├── components/         # Reusable UI components (the main output)
│   ├── common/        # Badge, Button, Input*, Table, etc.
│   └── layout/        # Sidebar, Header, Layout wrappers
├── pages/             # Showcase pages (one per feature area)
├── routes/
│   └── index.js       # React Router route definitions
├── utils/
│   └── common/        # cn() utility only
├── mocks/             # Hardcoded mock data for demos
├── App.js
├── index.js
└── index.css
```

---

## Styling Rules

### Use Tailwind only. Never use raw hex colors or inline styles.

**Color tokens (defined in `tailwind.config.js`):**

| Token | Value | Use for |
|-------|-------|---------|
| `primary` | `#FCFCFD` | Primary text / icon color |
| `primaryHover` | `#484858` | Hover states |
| `secondary` | `#DD7224` | Accent / brand color |
| `secondaryHover` | `#FF8B37` | Accent hover |
| `textPrimary` | `#FCFCFD` | Body text |
| `textSecondary` | `#D4D4D4` | Muted / secondary text |
| `neutral-850` | `#242424` | Card / panel backgrounds |
| `neutral-750` | `#212121` | Page background |
| `warning-500` | `#FEAA01` | Warning / caution states |
| `gradient-red` | linear-gradient | Primary buttons, accents |

**Correct:**
```jsx
<div className="bg-neutral-850 text-textPrimary rounded-lg p-4">
  <span className="text-secondary font-semibold">Accent text</span>
</div>
```

**Never:**
```jsx
// Raw hex
<div style={{ backgroundColor: "#242424", color: "#FCFCFD" }}>

// Inline styles for layout
<div style={{ display: "flex", gap: "8px" }}>
```

### `cn()` utility for conditional classes

```js
// src/utils/common/index.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

Usage:
```jsx
import { cn } from "utils/common";

<div className={cn("base-class", isActive && "text-secondary", className)}>
```

### Typography

- Font: Manrope — `font-sans` applies it automatically
- Use Tailwind size tokens only: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`

### Border radius

`rounded-sm` (4px) · `rounded` / `rounded-md` (6px) · `rounded-lg` (8px) · `rounded-xl` (12px) · `rounded-2xl` (16px) · `rounded-full`

---

## Component Pattern

Every component follows this exact structure:

```jsx
import PropTypes from "prop-types";
import { cn } from "utils/common";

function Badge({ variant = "default", size = "md", className, children }) {
  const variantStyles = {
    default: "bg-neutral-850 text-textPrimary",
    success: "bg-green-900 text-green-300",
    warning: "bg-yellow-900 text-warning-500",
    danger:  "bg-red-900 text-red-400",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full font-medium", variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  variant: PropTypes.oneOf(["default", "success", "warning", "danger"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default Badge;
```

**Rules:**
- Functional components only — no class components
- One `export default` per file, at the bottom
- Destructure props with default values in the function signature
- Always include `PropTypes`
- Always accept a `className` prop, merged with `cn()`
- Use variant/size maps (plain objects) for style variations
- Use hardcoded mock data for any displayed values — no props that expect API data

---

## File Naming

| Artifact | Convention | Example |
|----------|-----------|---------|
| Component | `PascalCase.js` | `Badge.js`, `InputText.js` |
| Page | `PascalCase/index.js` | `cameras/index.js` |
| Route file | camelCase | `routes/index.js` |
| Utility | camelCase | `utils/common/index.js` |
| Mock data | camelCase | `mocks/cameras.js` |

---

## Local State

Use `useState` and `useReducer` for component state. Nothing else.

```jsx
// Fine for toggles, tabs, open/close
const [isOpen, setIsOpen] = useState(false);
const [activeTab, setActiveTab] = useState("overview");
```

No Zustand. No Context. No Redux. No external state libraries.

---

## Mock Data

Put hardcoded demo data in `src/mocks/`. Import it directly into components or pages.

```js
// src/mocks/cameras.js
export const mockCameras = [
  { id: "CAM-001", name: "Camera Entrance A", status: "online", area: "Lobby" },
  { id: "CAM-002", name: "Camera Parking B", status: "offline", area: "Parking" },
];
```

---

## Code Quality

### `.prettierrc`

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindFunctions": ["clsx", "cn"]
}
```

### Comments

No comments unless the WHY is non-obvious. Never explain what the code does.

---

## What NOT to Do

- Do not use TypeScript
- Do not use raw hex colors — use Tailwind tokens only
- Do not use inline `style={{}}` — use Tailwind classes
- Do not make API calls (`fetch`, `axios`, `useQuery`, etc.)
- Do not install Zustand, React Query, Axios, or Socket.io
- Do not create class-based components
- Do not write comments that describe what the code does
