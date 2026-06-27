@AGENTS.md

# VACT — Codebase Reference

AI-powered Vietnamese university entrance exam (ĐGNL ĐHQG TP.HCM) preparation platform.
Stack: Next.js 16.2.9 App Router · Supabase SSR + Postgres · @google/genai@2.10.0 · TypeScript · no CSS framework.

---

## Critical Next.js 16 Conventions

- Middleware file is `proxy.ts` (not `middleware.ts`), exported function must be named `proxy`
- Route params: `type Params = Promise<{ id: string }>` → `const { id } = await params`
- Search params: `type SearchParams = Promise<{ key?: string }>` → `const { key } = await searchParams`
- Server Actions: `'use server'` at top of function or file; used for mutations + form submission
- Route Handlers: `app/api/*/route.ts` — export named `GET`/`POST`
- Read `node_modules/next/dist/docs/` if unsure about any API

---

## Architecture

```
app/
  page.tsx                          # Landing — reads session, redirects by role
  login/  signup/                   # Auth pages (Server Components + Server Actions)
  dashboard/
    layout.tsx                      # Checks session, redirects non-students; DashboardSidebar
    page.tsx                        # Home: real stats from test_submissions aggregate
    practice/page.tsx               # Question bank with part/module filters + pagination
    practice/PracticeFilters.tsx    # Client — auto-submitting part/module dropdowns
    practice/QuestionCard.tsx       # Client — AI explain + follow-up chat
    exams/page.tsx                  # Test list with prior submission scores
    exams/[id]/page.tsx             # Fetches questions (no answer field), renders TestClient
    exams/[id]/TestClient.tsx       # Client — timer, answer map, submit
    exams/[id]/result/[sid]/page.tsx # Diagnostic results (server) — imports ResultQuestionCard
    exams/[id]/result/ResultQuestionCard.tsx # Client — per-question AI explain + follow-up chat
    progress/page.tsx               # Stacked bar chart — pure CSS, no library
    settings/page.tsx               # Profile settings
  admin/
    layout.tsx                      # Checks role=admin; AdminSidebar
    page.tsx                        # Dashboard: real KPIs, clickable stat cards
    questions/page.tsx              # Question bank table with inline AnswerSwitch
    questions/import/page.tsx       # PDF upload → ImportClient
    questions/import/ImportClient.tsx  # Client — SSE stream, image upload per image_group
    questions/import/extract/route.ts  # Gemini PDF extraction via SSE
    questions/[id]/edit/page.tsx    # Edit single question
    tests/page.tsx                  # Test list with delete
    tests/new/page.tsx              # Create test form
    students/page.tsx               # Student roster — name, score, mini bars, last active
    students/[id]/page.tsx          # Student detail: lifetime breakdown + submission history
    stats/page.tsx                  # Platform stats: KPIs, questions by part, avg scores, recent
  api/
    explain/route.ts                # POST — AI solve/explain; accepts studentAnswer+correctAnswer
    chat/route.ts                   # POST — AI follow-up about a specific question
proxy.ts                            # Auth guard: protects /dashboard/* and /admin/*
lib/
  supabase/server.ts                # createClient() — SSR Supabase client
  supabase/client.ts                # createBrowserClient() — for Client Components
  auth/getProfile.ts                # getProfile(userId) → Profile | null
  exam/parts.ts                     # PARTS constant — part keys, labels, module labels
components/
  AdminSidebar.tsx                  # Nav: Tổng quan, Ngân hàng câu hỏi, Đề thi, Học sinh, Thống kê
  DashboardSidebar.tsx              # Nav: Tổng quan, Luyện tập, Đề thi, Tiến độ, Cài đặt
  DeleteButton.tsx                  # Client — confirm + server action
  ImageUpload.tsx                   # Client — file picker for question images
  TargetScoreSelector.tsx           # Client — slider 0–1200
  Toast.tsx                         # Client — flash message
supabase/schema.sql                 # Full idempotent schema — run in Supabase SQL editor
```

---

## Database Schema

### `profiles`
```
id uuid PK FK auth.users, full_name text null, school text null,
role text NOT NULL DEFAULT 'student', target_score integer null DEFAULT 1000,
created_at timestamptz, updated_at timestamptz
```
RLS: `users_read_own_profile` (own row), `users_update_own_profile` (own row),
`admins_read_all_profiles` — **requires `is_admin()` SECURITY DEFINER function** (see below).

### `questions`
```
id uuid PK, part text (viet|anh|toan|khoa_hoc), module text,
content text, option_a/b/c/d text, answer text (A|B|C|D),
explanation text null, difficulty text DEFAULT 'medium',
passage text null, image_description text null, image_url text null,
image_group int null, source text null, created_at, updated_at
```
RLS: `public_read_questions` (all), `admins_all_questions` (admin only write).

### `tests`
```
id uuid PK, title text, description text null, year int null,
created_by uuid FK auth.users, created_at, updated_at
```

### `test_questions`
```
id uuid PK, test_id FK tests, question_id FK questions, order_num int,
UNIQUE(test_id, question_id)
```

### `test_submissions`
```
id uuid PK, test_id FK tests, user_id FK auth.users,
answers jsonb DEFAULT '{}',   -- { question_id: 'A'|'B'|'C'|'D' }
score int DEFAULT 0,          -- correct answer count
total int DEFAULT 0,          -- total questions
breakdown jsonb DEFAULT '{}', -- { part: { correct, total, modules: { mod: { correct, total } } } }
created_at timestamptz
```
RLS: users read/insert own; admins all.

### Storage bucket: `question-images` (public)
Must be created manually in Supabase dashboard or via schema.sql.

---

## RLS — Critical Setup Required

The `admins_read_all_profiles` policy uses a SECURITY DEFINER function to avoid
self-referential recursion. Both must exist in Supabase:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;

CREATE POLICY "admins_read_all_profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());
```

Without this, `getProfile` returns null for admin (RLS recursion → silent null → admin
routed to /dashboard instead of /admin).

---

## ĐGNL Score System

- 4 parts: `viet`, `anh`, `toan`, `khoa_hoc`
- Each part: max 300 pts — `Math.round((correct / total) * 300)`
- Total max: 1200 pts
- `breakdown` JSONB shape: `{ viet: { correct: 5, total: 10, modules: { doc_hieu: { correct: 3, total: 5 } } } }`
- Dashboard home and progress page aggregate all submissions per user

---

## AI Endpoints

### `POST /api/explain`
```typescript
{
  content, option_a, option_b, option_c, option_d,
  passage?: string | null,
  studentAnswer?: string,   // what student picked (optional)
  correctAnswer?: string,   // revealed answer (optional)
}
```
- No `studentAnswer` + no `correctAnswer` → AI solves from scratch
- Both provided → contextual: right ("you got it, here's why") or wrong ("you picked X but Y is correct because...")
- Model: `gemini-2.5-flash`, `thinkingBudget: 2048`
- Streams plain text

### `POST /api/chat`
```typescript
{
  question: { content, option_a/b/c/d, passage?, correctAnswer?, studentAnswer? },
  priorExplanation: string,
  followUpQuestion: string,
}
```
- Follow-up about a specific question after initial AI explanation
- Model: `gemini-2.5-flash`, `thinkingBudget: 1024`
- Streams plain text

### PDF Extraction (`POST /admin/questions/import/extract`)
- Accepts PDF file upload
- Uses `gemini-2.5-flash` with `thinkingBudget: 8192`, `maxOutputTokens: 65536`
- Compact JSON format: `{ passages: string[], images: string[], questions: CompactQuestion[] }`
- Questions reference passage by index (`pi`) and image by index (`ii`)
- `image_group` groups questions sharing the same table/figure
- Streams SSE events: `{type:'progress'|'done'|'error', ...}`

---

## Part/Module Taxonomy (`lib/exam/parts.ts`)

```
viet:     doc_hieu, ngu_phap, van_hoc, dien_dat
anh:      reading, grammar, writing
toan:     dai_so, hinh_hoc, giai_tich, xac_suat
khoa_hoc: vat_ly, hoa_hoc, sinh_hoc, xa_hoi
```

---

## Key Patterns

### Server Component data fetch
```typescript
const supabase = await createClient()
const { data } = await supabase.from('table').select('...')
```

### Server Action
```typescript
'use server'
export async function myAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  // ...
  redirect('/some/path')
}
```

### AI streaming (Route Handler)
```typescript
const ai = new GoogleGenAI({ apiKey })
const stream = await ai.models.generateContentStream({ model: 'gemini-2.5-flash', ... })
const readable = new ReadableStream({ async start(ctrl) {
  for await (const chunk of stream) { if (chunk.text) ctrl.enqueue(encoder.encode(chunk.text)) }
  ctrl.close()
}})
return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } })
```

### AI streaming (Client Component)
```typescript
const res = await fetch('/api/explain', { method: 'POST', body: JSON.stringify({...}) })
const reader = res.body!.getReader()
let text = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  text += decoder.decode(value, { stream: true })
  setText(text)
}
```

### Supabase join type cast pattern
```typescript
const item = row.related_table as unknown as { field: string }
```

### CSS variables (defined in globals.css)
`--navy`, `--navy-light`, `--blue`, `--blue-light`, `--bg`, `--border`, `--text`, `--text-muted`,
`--card-shadow`, progress-bar-bg / progress-bar-fill classes

---

## Signup Flow

`signup/actions.ts` creates profile explicitly with `role: 'student'` after `supabase.auth.signUp()`.
The DB trigger `handle_new_user` is a backup — `ON CONFLICT (id) DO NOTHING` so it won't overwrite.

---

## Build Check

`npx next build` — must pass before any commit. TypeScript strict mode is on.
Common issues:
- Supabase join types need `as unknown as { ... }` cast
- Async params/searchParams must be awaited

---

## What's Built and Working

- Auth: landing router, login, signup, proxy guard, logout
- Admin: question bank, PDF import with AI, test management, student roster, platform stats
- Student: practice with AI explain + follow-up chat, full test-taking (timer + answer map + submit),
  diagnostic results, progress stacked chart, settings
- AI: `/api/explain` (contextual feedback) + `/api/chat` (follow-up)

## Known Gaps / Pending

- `is_admin()` function + `admins_read_all_profiles` policy must be created in Supabase (admin RLS fix)
- Storage bucket `question-images` must be created for image upload to work
- Dashboard home stat cards show 0 for brand-new students (correct — no data yet)
- Mobile layout not optimized (all inline px styles)
- No email display in admin students list (email is in auth.users, not profiles)
