# Image Generation Studio — Updated Spec (Local, No DB, No Tests)

**Context changes confirmed by Kalos:**

* ✅ Use **Runware** API for image generation.
* ✅ **No database** — ephemeral, in‑memory only.
* ✅ **No tests** required.
* ✅ **Local demo** only — no public deployment needed.

---

## Goals

Capture ad inputs → generate **5 distinct** LinkedIn‑style images → allow **per‑image tweaks** and re‑generation. Keep the stack simple, typed, and demo‑ready.

---

## Monorepo Layout (Turborepo + pnpm)

```
.
├─ apps/
│  ├─ web/                # React + Vite + Tailwind + tRPC client
│  └─ server/             # Node + Hono (or Express) + tRPC router
├─ packages/
│  ├─ trpc/               # shared types, zod schemas, api client
│  ├─ ui/                 # shared UI components (Buttons, Inputs, Cards)
│  └─ config/             # eslint, tsconfig, tailwind config
├─ pnpm-workspace.yaml
├─ turbo.json
└─ README.md
```

**Why:** Clear SoC, fast iteration, shared types, no persistence needed.

---

## Tech Stack

* **Frontend:** React + Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query, Zod, tRPC client.
* **Backend:** Node.js, TypeScript, Hono (or Express), **tRPC**, Zod.
* **Image Gen:** **Runware** Image Inference API (text‑to‑image by default; opt‑in i2i for style‑locked tweaks).
* **Auth/DB:** None.
* **Env:** `RUNWARE_API_KEY`.

---

## Environment & Scripts

**Root scripts**

```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint"
  }
}
```

**apps/server**

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc -p .",
    "start": "node dist/index.js"
  }
}
```

**apps/web**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

**.env** (root or `apps/server/.env.local`)

```
RUNWARE_API_KEY=your_key_here
VITE_TRPC_URL=http://localhost:3001/trpc
PORT=3001
```

---

## Frontend UX

### Page 1 — **Input Form** (`/`)

Fields:

* Company URL
* Product Name (optional)
* Business value (visual message)
* Audience (comma‑separated roles)
* Body Text (pre‑image ad copy; context only)
* Footer Text (CTA; optionally render on image)

Actions:

* **Generate 5 Images** → `trpc.images.generateBatch` → navigate `/studio?jobId=...` (or pass data through state).

Validation: Zod + react‑hook‑form. Autosave to localStorage.

### Page 2 — **Studio** (`/studio`)

* Render **5 image cards** in a responsive grid.
* Per‑card controls:

  * Aspect: `1.91:1 (1200×628)`, `1:1 (1080×1080)`, `4:5 (900×1125)`
  * Tweak textbox (freeform)
  * Quick chips: `bold typography`, `brand colors`, `minimalist`, `photo‑real`, `3D`, `gradient bg`, `add CTA on image`
  * **Regenerate** button
  * **Download** button (links to Runware `imageURL`)

States: loading spinner, error toast.

Accessibility: high contrast, focus rings, alt text ("ad concept conveying {VALUE}").

---

## Shared Types (packages/trpc)

```ts
import { z } from "zod";

export const AdInput = z.object({
  companyUrl: z.string().url(),
  productName: z.string().optional().default(""),
  businessValue: z.string().min(3),
  audience: z.string().min(3), // comma‑separated
  bodyText: z.string().min(3),
  footerText: z.string().min(2),
  renderCtaOnImage: z.boolean().optional().default(false)
});

export const Aspect = z.enum(["HORIZONTAL_191_1", "SQUARE_1_1", "VERTICAL_4_5"]);

export const TweakInput = z.object({
  imageId: z.string(),
  basePromptId: z.string(),
  aspect: Aspect,
  tweakText: z.string().optional().default("")
});

export type GeneratedImage = {
  id: string;
  url: string;
  aspect: z.infer<typeof Aspect>;
  seed?: number;
  cost?: number;
  meta: {
    model: string;
    steps: number;
    cfg: number;
    width: number;
    height: number;
    positivePrompt: string;
  };
};
```

---

## Backend — tRPC Router (apps/server)

```ts
// images.router.ts
import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { AdInput, TweakInput } from "@repo/trpc/schema";
import { buildFiveVariantPrompts, buildRunwareTask, runRunwareTasks, shapeBatchResponse, shapeSingle } from "../services/runware";

export const imagesRouter = router({
  generateBatch: publicProcedure
    .input(AdInput)
    .mutation(async ({ input }) => {
      const variants = buildFiveVariantPrompts(input);
      const tasks = variants.map(v => buildRunwareTask(v.prompt, v.aspect, v.model));
      const res = await runRunwareTasks(tasks);
      return shapeBatchResponse(res, variants);
    }),

  regenerate: publicProcedure
    .input(TweakInput)
    .mutation(async ({ input }) => {
      const base = await getBasePromptEphemeral(input.basePromptId); // in‑memory map
      const prompt = applyTweak(base, input.tweakText);
      const task = buildRunwareTask(prompt, input.aspect, base.model);
      const res = await runRunwareTasks([task]);
      return shapeSingle(res[0]);
    }),

  models: publicProcedure.query(() => curatedModels)
});
```

**Ephemeral storage**: use a simple in‑memory Map for `basePromptId → prompt recipe` during the session (reset on server restart). No DB.

---

## Runware Client (apps/server/services/runware.ts)

```ts
export function buildRunwareTask(positivePrompt: string, aspect: Aspect, model = DEFAULTS.model) {
  const { w, h } = ASPECT_SPECS[aspect];
  return {
    taskType: "imageInference",
    taskUUID: crypto.randomUUID(),
    outputType: "URL",
    outputFormat: "jpg",
    positivePrompt,
    height: h,
    width: w,
    model,
    steps: DEFAULTS.steps,
    CFGScale: DEFAULTS.cfg,
    numberResults: 1,
    includeCost: true
  };
}

export async function runRunwareTasks(tasks: any[]) {
  const res = await fetch("https://api.runware.ai/v1/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RUNWARE_API_KEY}`
    },
    body: JSON.stringify(tasks)
  });
  if (!res.ok) throw new Error(`Runware ${res.status}`);
  return (await res.json()) as any[]; // map to our GeneratedImage elsewhere
}

export const ASPECT_SPECS = {
  HORIZONTAL_191_1: { w: 1200, h: 628 },
  SQUARE_1_1: { w: 1080, h: 1080 },
  VERTICAL_4_5: { w: 900, h: 1125 }
} as const;

export const DEFAULTS = { steps: 28, cfg: 7.0, model: "runware:101@1" } as const;
```

*(Note: If you prefer image‑to‑image for tweaks, extend with `seedImage` + `strength` and pass the prior URL as input.)*

---

## Prompt Engineering

**Shared context:**

* `BRAND` (domain from URL or user input)
* `PRODUCT`, `VALUE`, `AUDIENCE` (top 2–3 titles), `BODY`, `CTA`
* `TONE`: B2B, trustworthy, modern, high‑contrast, accessible
* `COMPOSITION`: ad hero visual with space for copy, clear hierarchy, safe margins

**Negative prompt (global):** `low contrast, busy layout, tiny text, unreadable, watermark, distorted logo`

**5 initial style recipes:**

1. **Bold Type Poster** – large, legible headline of `${VALUE}`, brand color blocks, subtle gradient
2. **Photo‑real Workflow** – office scene implying `${VALUE}`, overlay space for copy
3. **Illustrated Metaphor** – flat vector metaphor of `${VALUE}`, geometric shapes
4. **3D Object Hero** – 3D symbol of `${VALUE}`, studio lighting, soft shadows
5. **Data/Chart Motif** – abstract data viz implying `${VALUE}`, grid background

**CTA on image (optional):** append `Add a small footer ribbon with CTA: "${CTA}"; keep legible and unobtrusive.`

**Tweak mapping (freeform → prompt tokens):**

* `color: brand|blue|warm` → emphasize palette
* `style: minimalist|3d|photo|illustration` → switch model hints
* `format: square|vertical|horizontal` → change aspect
* `background: gradient|solid|photo`
* `add logo` → reserve top‑left badge space (placeholder; no logo fetch)

`applyTweak(base, text)` will:

* parse keywords (simple regex) → modify tokens
* concatenate freeform text to end of `positivePrompt`

---

## Frontend Components (apps/web)

* `FormPage.tsx` – collects inputs, calls `generateBatch`, routes to Studio
* `StudioPage.tsx` – grid of `ImageCard`
* `ImageCard.tsx` – shows image + aspect select + tweak textarea + chips + regenerate + download
* `AspectSelect.tsx`, `TweakChips.tsx`, `Button.tsx`, `Input.tsx`, `Textarea.tsx`

State mgmt via TanStack Query mutations; toast for errors.

---

## README.md (ship in repo)

**Setup**

```bash
pnpm i
pnpm dev   # runs server and web via turbo
```

**Environment**

```
RUNWARE_API_KEY=...
VITE_TRPC_URL=http://localhost:3001/trpc
PORT=3001
```

**Approach**

* Simple local demo with typed FE↔BE via tRPC
* Runware task API for fast generation (T2I; optional I2I for style‑locked tweaks)
* Five distinct prompt recipes for variety; aspect presets for LinkedIn norms
* No persistence; ephemeral in‑memory prompt map only

**Decisions/Tradeoffs**

* Skipped DB, auth, tests, and deployment to move fast
* Logo/brand palette not auto‑fetched (kept scope tight)
* Edits default to prompt‑level changes; I2I available if time permits

**Limitations**

* Server restart clears ephemeral map
* No guarantee of strict brand compliance

**Demo script**

1. Fill the form with the Superhuman example → Generate.
2. In Studio, set one card to **Square**, tweak: `minimalist, brand colors, add CTA on image` → Regenerate.
3. Download an image from its URL.
