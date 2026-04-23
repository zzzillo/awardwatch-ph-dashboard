export type FilterKey = "awardees" | "areas" | "categories" | "organizations";

export const filterLabels: Record<FilterKey, string> = {
  awardees: "Awardees",
  areas: "Areas",
  categories: "Business categories",
  organizations: "Organizations",
};

export const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const defaultYears = Array.from({ length: new Date().getFullYear() - 2007 + 1 }, (_, index) => 2007 + index);

export const ui = {
  eyebrow: "text-[11px] font-black uppercase tracking-[0.18em] text-lime-300",
  panel: "min-w-0 rounded-md border border-zinc-800 bg-zinc-950",
  panelPad: "p-3 sm:p-4",
  label: "grid gap-1 text-xs font-bold text-zinc-500",
  input:
    "min-h-9 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm font-semibold text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-lime-300/70",
  button:
    "min-h-9 rounded border border-zinc-800 bg-black px-3 py-2 text-sm font-black text-zinc-100 transition hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40",
};
