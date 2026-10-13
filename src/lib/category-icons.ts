// The one place that maps an icon NAME (what the database stores) to a lucide component.
// Used by the categories context, the Categories page (icon picker) and, for validation,
// the category API. To offer a new icon: import it, add it to CATEGORY_ICONS, and add a
// row to ICON_CHOICES.
//
// Tailwind only generates classes it can see as whole strings in the source, so the
// bg-*/text-* classes of every icon pair must be written out here (and in
// default-categories.ts), not built dynamically.
import {
  Baby,
  Banknote,
  Book,
  Briefcase,
  Camera,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  MoreHorizontal,
  Music,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  Wifi,
  Wine,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS = {
  Baby,
  Banknote,
  Book,
  Briefcase,
  Camera,
  Car,
  Clapperboard,
  Coffee,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  MoreHorizontal,
  Music,
  PawPrint,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  Wifi,
  Wine,
  Wrench,
} satisfies Record<string, LucideIcon>;

export type CategoryIconName = keyof typeof CATEGORY_ICONS;

export const isCategoryIconName = (v: unknown): v is CategoryIconName =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(CATEGORY_ICONS, v);

// Unknown names (for example an icon removed from the registry later) fall back to a
// neutral icon instead of crashing the page.
export function getCategoryIcon(name: string): LucideIcon {
  return isCategoryIconName(name) ? CATEGORY_ICONS[name] : MoreHorizontal;
}

// What the "Add Category" icon picker offers, in display order
export const ICON_CHOICES: { name: CategoryIconName; iconBg: string; iconColor: string }[] = [
  { name: "UtensilsCrossed", iconBg: "bg-orange-100", iconColor: "text-orange-500" },
  { name: "Plane", iconBg: "bg-sky-100", iconColor: "text-sky-500" },
  { name: "Home", iconBg: "bg-blue-100", iconColor: "text-blue-500" },
  { name: "ShoppingBag", iconBg: "bg-amber-100", iconColor: "text-amber-500" },
  { name: "Clapperboard", iconBg: "bg-orange-100", iconColor: "text-amber-600" },
  { name: "Receipt", iconBg: "bg-rose-100", iconColor: "text-rose-500" },
  { name: "MoreHorizontal", iconBg: "bg-teal-100", iconColor: "text-teal-500" },
  { name: "Dumbbell", iconBg: "bg-emerald-100", iconColor: "text-emerald-500" },
  { name: "Banknote", iconBg: "bg-green-100", iconColor: "text-green-600" },
  { name: "Briefcase", iconBg: "bg-sky-100", iconColor: "text-sky-500" },
  { name: "TrendingUp", iconBg: "bg-amber-100", iconColor: "text-amber-500" },
  { name: "Sparkles", iconBg: "bg-lime-100", iconColor: "text-lime-600" },
  { name: "Car", iconBg: "bg-slate-100", iconColor: "text-slate-600" },
  { name: "Fuel", iconBg: "bg-red-100", iconColor: "text-red-500" },
  { name: "Coffee", iconBg: "bg-amber-100", iconColor: "text-amber-700" },
  { name: "Wine", iconBg: "bg-purple-100", iconColor: "text-purple-500" },
  { name: "Gift", iconBg: "bg-pink-100", iconColor: "text-pink-500" },
  { name: "Heart", iconBg: "bg-rose-100", iconColor: "text-rose-500" },
  { name: "Pill", iconBg: "bg-cyan-100", iconColor: "text-cyan-600" },
  { name: "GraduationCap", iconBg: "bg-indigo-100", iconColor: "text-indigo-500" },
  { name: "Book", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { name: "Music", iconBg: "bg-fuchsia-100", iconColor: "text-fuchsia-500" },
  { name: "Gamepad2", iconBg: "bg-violet-100", iconColor: "text-violet-500" },
  { name: "Camera", iconBg: "bg-stone-100", iconColor: "text-stone-600" },
  { name: "Shirt", iconBg: "bg-teal-100", iconColor: "text-teal-600" },
  { name: "Smartphone", iconBg: "bg-sky-100", iconColor: "text-sky-600" },
  { name: "Laptop", iconBg: "bg-gray-100", iconColor: "text-gray-600" },
  { name: "Wifi", iconBg: "bg-blue-100", iconColor: "text-blue-500" },
  { name: "Wrench", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  { name: "PawPrint", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  { name: "Baby", iconBg: "bg-pink-100", iconColor: "text-pink-400" },
  { name: "PiggyBank", iconBg: "bg-green-100", iconColor: "text-green-600" },
];
