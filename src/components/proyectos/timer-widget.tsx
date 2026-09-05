"use client";

import { useEffect, useState } from "react";
import { stopTimerSession } from "@/lib/actions/work-sessions";

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TimerWidget({ projectId }: { projectId: string }) {
  const storageKey = `yakana-timer-${projectId}`;
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [stopping, setStopping] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Read the in-progress timer (if any) after mount, so the server-rendered
    // "idle" state always matches the client's first render and hydration
    // doesn't mismatch — this is the standard localStorage-sync pattern.
    const stored = localStorage.getItem(storageKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setStartedAt(stored);
  }, [storageKey]);

  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  function handleStart() {
    const iso = new Date().toISOString();
    localStorage.setItem(storageKey, iso);
    setStartedAt(iso);
    setNow(Date.now());
  }

  async function handleSave(formData: FormData) {
    if (!startedAt) return;
    setSaving(true);
    formData.set("started_at", startedAt);
    await stopTimerSession(projectId, formData);
    localStorage.removeItem(storageKey);
    setStartedAt(null);
    setStopping(false);
    setSaving(false);
  }

  if (!startedAt) {
    return (
      <div className="rounded-yakana border border-linen bg-offwhite p-6 text-center">
        <button
          type="button"
          onClick={handleStart}
          className="rounded-yakana bg-terracotta px-6 py-3 text-lg font-medium text-offwhite hover:bg-terracotta-dark"
        >
          ▶ Iniciar sesión de trabajo
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-yakana border border-linen bg-offwhite p-6 text-center">
      <p className="font-heading text-4xl text-navy">{formatElapsed(now - Date.parse(startedAt))}</p>
      <p className="mt-1 text-xs text-charcoal/60">
        Empezó a las {new Date(startedAt).toLocaleTimeString("es-AR")}
      </p>

      {!stopping ? (
        <button
          type="button"
          onClick={() => setStopping(true)}
          className="mt-4 rounded-yakana border border-terracotta/40 px-6 py-2.5 text-sm font-medium text-terracotta hover:bg-terracotta/10"
        >
          ■ Detener
        </button>
      ) : (
        <form action={handleSave} className="mt-4 flex flex-col items-center gap-2">
          <textarea
            name="notes"
            rows={2}
            placeholder="Nota de esta sesión (opcional)"
            className="w-full max-w-sm rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-yakana bg-terracotta px-5 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-dark disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar sesión"}
          </button>
        </form>
      )}
    </div>
  );
}
