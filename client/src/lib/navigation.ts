import {
  LayoutDashboard,
  FileText,
  Wrench,
  Briefcase,
  Shield,
  BarChart3,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
  entitlement?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["sales", "builder", "admin", "super_admin", "dual"],
  },
  {
    path: "/dashboard/sales",
    label: "Leads",
    icon: FileText,
    roles: ["sales", "dual", "admin", "super_admin"],
  },
  {
    path: "/dashboard/builder",
    label: "Services",
    icon: Wrench,
    roles: ["builder", "dual", "admin", "super_admin"],
  },
  {
    path: "/dashboard/jobs",
    label: "Job Board",
    icon: Briefcase,
    roles: ["builder", "dual", "admin", "super_admin"],
  },
  {
    path: "/dashboard/admin",
    label: "Admin",
    icon: Shield,
    roles: ["admin", "super_admin"],
  },
  {
    path: "/dashboard/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["sales", "builder", "dual", "admin", "super_admin"],
    entitlement: "reports.export",
  },
  {
    path: "/dashboard/billing",
    label: "Billing",
    icon: CreditCard,
    roles: ["sales", "builder", "dual", "admin", "super_admin"],
  },
];

export type RoleOption = {
  value: string;
  label: string;
};

export function getNavItems(
  role: string | undefined,
  entitlements: string[] = [],
): NavItem[] {
  const userRole = role ?? "";
  const isAdmin = userRole === "admin" || userRole === "super_admin";

  return NAV_ITEMS.filter(
    (item) =>
      (item.roles.includes(userRole) || isAdmin) &&
      (!item.entitlement || entitlements.includes(item.entitlement)),
  );
}

export function getRoleOptions(role: string | undefined): RoleOption[] {
  if (role === "dual") {
    return [
      { value: "sales", label: "Sales View" },
      { value: "builder", label: "Builder View" },
    ];
  }
  if (role === "admin" || role === "super_admin") {
    return [
      { value: "admin", label: "Admin View" },
      { value: "sales", label: "Sales View" },
      { value: "builder", label: "Builder View" },
    ];
  }
  return [];
}

export function getDefaultDashboardRoute(role: string | undefined): string {
  switch (role) {
    case "admin":
    case "super_admin":
      return "/dashboard/admin";
    case "builder":
      return "/dashboard/builder";
    case "sales":
      return "/dashboard/sales";
    case "dual":
      return "/dashboard/sales";
    default:
      return "/dashboard/sales";
  }
}
