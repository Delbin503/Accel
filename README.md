# Delbin Accel UI

Pure frontend component showcase for the BLUESILO accel platform. Delbin builds UI components here using vibe coding; developers copy them into `trms-accel-fe`.

No API calls. No backend. Just React + Tailwind.

---

## Prerequisites

- Node.js 18+
- npm 9+
- Git
- A GitHub account (for Vercel auto-deploy)

---

## 1. Bootstrap the Project

```bash
npx create-react-app delbin-accel-ui
cd delbin-accel-ui
```

---

## 2. Install Dependencies

```bash
npm install \
  clsx@^2.1.1 \
  dayjs@^1.11.10 \
  prop-types@^15.8.1 \
  react-router-dom@^6.16.0 \
  react-select@^5.10.2 \
  react-toastify@^11.0.5 \
  recharts@^3.5.1 \
  tailwind-merge@^3.4.0

npm install --save-dev \
  autoprefixer@^10.4.16 \
  postcss@^8.4.31 \
  prettier@^3.3.2 \
  prettier-plugin-tailwindcss@^0.5.14 \
  tailwindcss@^3.3.3
```

---

## 3. Configure Tailwind CSS

```bash
npx tailwindcss init -p
```

Replace `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#FCFCFD",
        primaryHover: "#484858",
        secondary: "#DD7224",
        secondaryHover: "#FF8B37",
        textPrimary: "#FCFCFD",
        textSecondary: "#D4D4D4",
        "neutral-850": "#242424",
        "neutral-750": "#212121",
        "warning-500": "#FEAA01",
      },
      backgroundImage: {
        "gradient-red": "linear-gradient(77.14deg, #EE4D2D 14.94%, #AC0001 93.95%)",
      },
      borderRadius: {
        DEFAULT: "6px",
        sm:  "4px",
        md:  "6px",
        lg:  "8px",
        xl:  "12px",
        "2xl": "16px",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
      },
      fontSize: {
        xs:    ["12px", { lineHeight: "16px" }],
        sm:    ["14px", { lineHeight: "20px" }],
        base:  ["16px", { lineHeight: "24px" }],
        lg:    ["18px", { lineHeight: "28px" }],
        xl:    ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
      },
      keyframes: {
        "slide-in-right": {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

module.exports = config;
```

Add Tailwind directives to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Add Manrope font to `public/index.html` inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

---

## 4. Add `.prettierrc`

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

Add to `package.json` under `"scripts"`:

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

---

## 5. Create Folder Structure

```bash
mkdir -p src/components/common
mkdir -p src/components/layout
mkdir -p src/pages
mkdir -p src/routes
mkdir -p src/utils/common
mkdir -p src/mocks
```

Create `src/utils/common/index.js`:

```js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

---

## 6. Configure `jsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": "src"
  },
  "include": ["src"]
}
```

Enables absolute imports: `import { cn } from "utils/common"` instead of `../../utils/common`.

---

## 7. Vercel Auto-Deploy Setup

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial setup"
git remote add origin https://github.com/<your-username>/delbin-accel-ui.git
git push -u origin main
```

### Step 2 — Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import the GitHub repo
3. Framework preset: **Create React App**
4. Verify build settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
5. Click **Deploy**

### Step 3 — Done

Every push to `main` auto-deploys to Vercel.

---

## 8. How Developers Copy Components

1. Browse the Vercel URL, find the component you need
2. Open `src/components/{name}.js` in this repo
3. Copy it into `trms-accel-fe/src/components/` (same subfolder)
4. Same Tailwind tokens — no style changes needed

---

## Scripts

```bash
npm start             # Dev server
npm run build         # Production build
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```
