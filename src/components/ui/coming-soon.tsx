export function ComingSoon({ items }: { items: string[] }) {
  return (
    <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-6">
      <p className="mb-3 text-sm font-medium text-terracotta">Próximamente en esta sección</p>
      <ul className="list-inside list-disc space-y-1.5 text-sm text-charcoal/80">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
