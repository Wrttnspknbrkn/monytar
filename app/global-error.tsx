"use client"

// Last-resort boundary: replaces the whole document when the root layout
// itself fails. Deliberately dependency-free (plain HTML + inline styles, no
// providers, no design-system components) so it can't fail for the same
// reason the app did, and always leaves a way to recover.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const button = {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  } as const
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h1>
            <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Monytar hit an unexpected error. Try again, or go back to the sign-in page to start a fresh session.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => reset()} style={{ ...button, background: "#2563eb", color: "#fff", border: "1px solid #2563eb" }}>
                Try again
              </button>
              <a href="/dashboard" style={button}>Dashboard</a>
              <a href="/login" style={button}>Sign in</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
