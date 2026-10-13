import {
  LayoutGrid,
  ArrowLeftRight,
  Wallet,
  Layers,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutGrid },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "Budget", href: "/budget", icon: Wallet },
  { label: "Categories", href: "/categories", icon: Layers },
  { label: "Profile", href: "/profile", icon: User },
];
