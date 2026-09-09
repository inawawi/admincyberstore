"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login gagal.");
      router.replace("/admin");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login gagal.");
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <div>
        <span className="eyebrow">WELCOME BACK</span>
        <h1>Masuk ke panel admin</h1>
        <p>Gunakan akun admin yang sudah tersimpan di database Laravel.</p>
      </div>
      {error && <div className="inline-alert error"><Icon name="AlertTriangle" size={18} /><span>{error}</span></div>}
      <label className="field-label">
        <span>Email admin</span>
        <div className="input-with-icon"><Icon name="UserRound" size={17} /><input name="email" type="email" autoComplete="email" placeholder="superadmin@bsi.ac.id" required autoFocus /></div>
      </label>
      <label className="field-label">
        <span>Password</span>
        <div className="input-with-icon"><Icon name="Database" size={17} /><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Masukkan password" required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}><Icon name={showPassword ? "EyeOff" : "Eye"} size={17} /></button></div>
      </label>
      <button className="primary-button login-button" type="submit" disabled={loading}>
        {loading ? <><span className="spinner" />Memeriksa akun…</> : <>Masuk<Icon name="ChevronRight" size={17} /></>}
      </button>
      <div className="secure-note"><Icon name="Wifi" size={15} /><span>Sesi terenkripsi • Cookie HTTP-only</span></div>
    </form>
  );
}
