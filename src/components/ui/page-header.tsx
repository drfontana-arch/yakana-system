export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="font-heading text-3xl italic text-navy sm:text-4xl">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-charcoal/70">{description}</p>
      ) : null}
      <div className="andean-divider mt-4 max-w-xs" />
    </div>
  );
}
