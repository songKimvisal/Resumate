# How Resumate builds a resume

This document explains the technology and pipeline behind creating, previewing, saving, and exporting a resume.

## Stack

If a judge asks **what technology did you use**, start with three names:

1. **React + TypeScript + Vite** — website and resume builder
2. **FastAPI (Python)** — AI, credits, PDF save limits, template unlocks
3. **Supabase** — login and Postgres (resumes, RLS)

Then fill in:

| Layer | Technology | Role |
|---|---|---|
| App | React 19 + TypeScript + Vite | Builder UI, live preview, dashboard |
| Styling | Tailwind CSS 4 | Website chrome (not the printed page) |
| Routing | React Router | Public vs logged-in pages |
| State | Zustand (`useResumeStore`) | Single in-memory resume while editing |
| Rich text | TipTap | Summary, experience, and education HTML |
| i18n | i18next | Website EN / Khmer |
| Auth + DB | Supabase (Postgres + Auth + RLS) | Account and saved resume JSON |
| Preview | Custom React page engine | A4/Letter pages in the browser |
| PDF | `@react-pdf/renderer` | Downloadable PDF from the same data |
| API | FastAPI + Uvicorn | JWT, credits, templates, job analysis |
| AI | Gemini (`google-genai`); optional Ollama | Rewrite + job match; one `generate_text()` |

Spoken why: the browser is fast for typing and preview. The Python API is trusted for money and AI keys. Supabase is login + database so we did not write our own auth server.

One-line answers per tool: `docs/PRESENTATION.md` → **Technology**.

There is no server-side HTML-to-PDF step. The browser holds the resume object, draws it on screen, and the same object is sent to the PDF renderer.

## Data model

One resume is a typed `Resume` object (`frontend/src/types/resume.ts`):

- **Identity** - `id`, `title`, `builderStep` (which wizard step to reopen)
- **Personal** - name, title, contact, photo, summary (HTML)
- **Work** - `experience[]` or `noExperience[]` (fresh-graduate path)
- **Education, skills, languages, references**
- **Customization** - template, colors, fonts, margins, columns, section order, layout variant

Templates are not separate documents. A template preset is a `Customization` snapshot (colors, fonts, `layoutVariant`, column setup) applied onto the same content.

The empty starting point is `emptyResume`. List items get ids from `crypto.randomUUID()`.

## Builder flow

Route: `/builder` → `BuilderLayout`.

The wizard is five steps, plus a Customize panel:

1. **Personal info** - identity, photo, summary  
2. **Experience** - jobs, or a no-experience / project path  
3. **Education** - school, dates, achievements  
4. **Skills & more** - skills, languages, references  
5. **Review** - save and download PDF  

Long text uses TipTap (`RichTextEditor`) and is stored as HTML. Smart Rewrite can replace a field with AI variations without changing layout.

The left pane is the form. The right pane is a live `ResumePreview` that reads the Zustand store. Both panes scroll on their own. Edits debounce-save (~800ms) through `saveResumeToDashboard`.

## Persistence

```
Zustand resume  →  saveResumeToDashboard()  →  Supabase public.resumes
```

Table shape (`frontend/supabase/migrations/20260721060704_create_resumes_table.sql`):

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | `auth.users`, cascade delete |
| `title` | text | Display name |
| `data` | jsonb | Full `Resume` object |
| `updated_at` | timestamptz | Sort / “saved” state |

Row Level Security: a user can only read or write their own rows.

Opening **My Resumes** calls `setResume` and returns to `/builder` on the saved `builderStep`.

## Live preview

`ResumePreview` is the source of truth for on-screen pages.

### Default layout (`layoutVariant: "default"`)

1. Flatten content into **blocks** (header, summary fragments, each job/education heading, each bullet, each skill/language line).
2. Measure each block off-screen at the real page content width.
3. Pack blocks into pages using the usable A4/Letter height (minus margins).
4. Draw each page at native size, then **scale** it to the preview pane (`transform: scale`).

Rich HTML is split so a long section can continue on the next page:

- Lists → one block per `<li>`
- `<br>` lines and nested wrappers → separate blocks
- Skills | Languages share a two-column row and fill leftover space, then continue on the following page

### Special layouts

If `customization.layoutVariant` is not `"default"` (for example `designerBlock`, `techSplit`, `warmColumns`), preview switches to `SpecialPaginatedLayout`:

1. Flatten content into **units** (summary slices, education slices, job slices).
2. Measure and pack units into a page budget.
3. Build a per-page resume subset (`applyPagePlan`) - later pages hide identity chrome and only show overflow.
4. Render that subset with the matching layout component in `frontend/src/components/resume/layouts/`.

Thumbnails (home, dashboard, marketplace) use `ScaledResumePreview` (first page only, scaled to the card).

## PDF export

```
downloadResumePdf(resume)
  → <ResumeDocument resume={resume} />
  → @react-pdf/renderer pdf().toBlob()
  → browser download
```

- **Default layout** → `ResumeDocument` mirrors the preview: same sections, fonts, margins, and wrapping. Experience/education entries can split across pages; individual bullets stay together.
- **Special layout** → `SpecialPdfDocument` in `SpecialPdfLayouts.tsx` (a PDF twin of each visual template).

HTML from TipTap is converted with `richTextToPdf` (`frontend/src/lib/richTextToPdf.tsx`): one PDF row per paragraph or list item.

Page size follows `customization.pageFormat` (`A4` or `Letter`). CSS pixels (96 dpi) are mapped to PDF points so the file matches the preview.

## Templates

Presets live in `frontend/src/data/templates/`:

- **Free / premium** by industry (banking, tech, NGO, hospitality, fresh graduate, designer)
- Each preset sets `customization` (and often `layoutVariant`)
- Marketplace / Customize applies a preset; content fields stay the same

Choosing a template does not generate a new file. It restyles the current resume object.

## End-to-end path

```
User types in builder
        │
        ▼
 Zustand Resume (HTML + customization)
        │
        ├──────────────► ResumePreview  (measured blocks → scaled A4 pages)
        │
        ├──────────────► Supabase jsonb  (autosave / My Resumes)
        │
        └──────────────► ResumeDocument  (react-pdf blob download)
```

## Key files

| Path | What it does |
|---|---|
| `frontend/src/types/resume.ts` | Resume + customization types, `emptyResume` |
| `frontend/src/store/resumeStore.ts` | Edit API and dirty/saved flags |
| `frontend/src/pages/builder/` | Wizard steps, customize, autosave layout |
| `frontend/src/components/resume/ResumePreview.tsx` | Default live pagination |
| `frontend/src/components/resume/layouts/` | Special visual templates |
| `frontend/src/components/resume/layouts/SpecialPaginatedLayout.tsx` | Special-layout page packing |
| `frontend/src/components/resume/pdf/ResumeDocument.tsx` | Default PDF |
| `frontend/src/components/resume/pdf/SpecialPdfLayouts.tsx` | Special-layout PDFs |
| `frontend/src/lib/richTextToPdf.tsx` | TipTap HTML → PDF nodes |
| `frontend/src/lib/downloadResumePdf.tsx` | Trigger download |
| `frontend/src/lib/api.ts` | Supabase save / list / delete |
| `frontend/src/data/templates/` | Industry presets |
