import { ui } from "../dashboard/config";

export function KpiGrid({ items }: { items: Array<[string, string, string]> }) {
  return (
    <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
      {items.map(([label, value, note]) => (
        <article className={`${ui.panel} p-3`} key={label}>
          <p className={ui.eyebrow}>{label}</p>
          <strong className="mt-2 block break-words text-2xl font-black leading-none tracking-normal text-zinc-100 sm:text-3xl">{value}</strong>
          <span className="mt-2 block text-sm leading-snug text-zinc-500">{note}</span>
        </article>
      ))}
    </section>
  );
}
