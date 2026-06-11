# Dzii Finance

A personal finance tracking app built with React, Vite, Tailwind, and Lovable Cloud (Supabase).

## Local development

```bash
bun install
cp .env.example .env   # then fill in the values
bun run dev
```

The app starts on http://localhost:8080.

## Environment variables

All client-side config is delivered through Vite env vars (`VITE_*`). No
credentials are hardcoded in source. If any required variable is missing,
the app shows a developer-friendly configuration screen instead of
crashing.

| Variable                         | Required | Purpose                                           |
| -------------------------------- | -------- | ------------------------------------------------- |
| `VITE_SUPABASE_URL`              | yes      | Backend project URL (e.g. `https://xxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | yes      | Publishable (anon) key — safe in the browser      |
| `VITE_SUPABASE_PROJECT_ID`       | yes      | Project ref id, used by generated types           |

### Where to get the values

- **Lovable Cloud project** — open the project in Lovable and click
  **View Backend**. The Project URL and publishable (anon) key are shown
  in the backend settings.
- **External Supabase project** — Supabase Dashboard → Project Settings
  → API. Use the **Project URL** and the **anon / publishable** key.

Never commit the `service_role` key or database password — they are not
used by the frontend.

### Vercel deployment

In the Vercel project: **Settings → Environment Variables**, add the
three `VITE_*` variables above for the **Production**, **Preview**, and
**Development** environments. Redeploy after changing values — Vite
inlines env vars at build time.

### Other deployments

Any static host works (Netlify, Cloudflare Pages, S3 + CloudFront, …).
Define the same `VITE_*` variables in the host's build environment
before running `bun run build`, then deploy the contents of `dist/`.

## Scripts

- `bun run dev` — start the Vite dev server
- `bun run build` — production build to `dist/`
- `bun run preview` — preview the production build locally