import {
  Building2, Pill, ShoppingBasket, Zap, Armchair, Users, Truck, Package,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  "building-2": Building2,
  pill: Pill,
  "shopping-basket": ShoppingBasket,
  zap: Zap,
  armchair: Armchair,
  users: Users,
  truck: Truck,
  package: Package,
};

export const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  blue: { bg: "bg-sky-500/10", text: "text-sky-600", ring: "ring-sky-500/20" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-600", ring: "ring-rose-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600", ring: "ring-emerald-500/20" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600", ring: "ring-amber-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-600", ring: "ring-orange-500/20" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-600", ring: "ring-violet-500/20" },
  sky: { bg: "bg-sky-500/10", text: "text-sky-600", ring: "ring-sky-500/20" },
  slate: { bg: "bg-slate-500/10", text: "text-slate-600", ring: "ring-slate-500/20" },
};

export function iconFor(name: string) {
  return ICON_MAP[name] || Package;
}
export function colorFor(name: string) {
  return COLOR_MAP[name] || COLOR_MAP.slate;
}
