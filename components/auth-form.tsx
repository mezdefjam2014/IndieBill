"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMessage("");
    const f = new FormData(e.currentTarget);
    const supabase = createClient();
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email, password,
          options: {
            data: {
              display_name: String(f.get("display_name") || ""),
              account_type: String(f.get("account_type") || "listener"),
            },
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    location.href = mode === "login" ? "/dashboard" : "/check-email";
  }

  return (
    <form className="card form" onSubmit={submit}>
      <span className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN INDIE BILLBOARD"}</span>
      <h1>{mode === "login" ? "Login" : "Create account"}</h1>
      {mode === "signup" && <>
        <label>Display name<input name="display_name" required /></label>
        <label>Account type<select name="account_type"><option value="listener">Listener</option><option value="artist">Artist</option></select></label>
      </>}
      <label>Email<input name="email" type="email" required /></label>
      <label>Password<input name="password" type="password" minLength={8} required /></label>
      <button className="button" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}</button>
      {message && <p className="message error">{message}</p>}
    </form>
  );
}
