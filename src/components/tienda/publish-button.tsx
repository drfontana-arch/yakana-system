"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { publishProjectToStore } from "@/lib/actions/tiendanube";

export function PublishButton({
  projectId,
  alreadyPublished,
}: {
  projectId: string;
  alreadyPublished: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    const result = await publishProjectToStore(projectId);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-yakana bg-terracotta px-3 py-1.5 text-xs font-medium text-offwhite hover:bg-terracotta-dark disabled:opacity-50"
      >
        <Store size={13} />
        {loading ? "Publicando…" : alreadyPublished ? "Actualizar en la tienda" : "Publicar en la tienda"}
      </button>
      {error ? <p className="mt-1 text-xs text-terracotta">{error}</p> : null}
    </div>
  );
}
