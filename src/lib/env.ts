/**
 * Runtime validation for required Vite environment variables.
 *
 * Keeps the app from crashing with an opaque error when env vars are
 * missing in local development. Returns a list of missing variable
 * names so the caller can render a developer-friendly message.
 */

const REQUIRED_ENV_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

export type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

export function getMissingEnvVars(): RequiredEnvVar[] {
  const env = import.meta.env as Record<string, string | undefined>;
  return REQUIRED_ENV_VARS.filter((key) => {
    const value = env[key];
    return !value || value.trim().length === 0;
  });
}

export function renderEnvErrorScreen(missing: RequiredEnvVar[]): void {
  const root = document.getElementById("root");
  const message = `Missing environment variables:\n${missing.join("\n")}\n\nPlease configure your .env file (see .env.example).`;

  // Always log to the console so it shows up in CI / preview logs.
  // eslint-disable-next-line no-console
  console.error(`[env] ${message}`);

  if (!root) return;

  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b1416;color:#e6f1f3;">
      <div style="max-width:560px;width:100%;background:#101f23;border:1px solid #1f3a40;border-radius:16px;padding:28px;box-shadow:0 8px 24px rgba(0,0,0,0.35);">
        <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;">Configuration required</h1>
        <p style="margin:0 0 16px;color:#9fb7bc;font-size:14px;line-height:1.5;">
          The application can&rsquo;t start because required environment variables are missing.
        </p>
        <pre style="margin:0 0 16px;padding:14px 16px;background:#0b1416;border:1px solid #1f3a40;border-radius:10px;color:#7fd4e0;font-size:13px;white-space:pre-wrap;word-break:break-word;">${message
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")}</pre>
        <p style="margin:0;color:#9fb7bc;font-size:13px;line-height:1.5;">
          Copy <code style="background:#0b1416;padding:2px 6px;border-radius:4px;">.env.example</code> to
          <code style="background:#0b1416;padding:2px 6px;border-radius:4px;">.env</code>, fill in the values,
          then restart the dev server.
        </p>
      </div>
    </div>
  `;
}