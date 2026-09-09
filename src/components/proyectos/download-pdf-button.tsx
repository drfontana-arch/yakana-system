"use client";

import { Download } from "lucide-react";

export function DownloadPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 rounded-yakana bg-terracotta px-4 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark"
    >
      <Download size={16} />
      Descargar PDF
    </button>
  );
}
