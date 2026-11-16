import {
  LayoutDashboard,
  FileText,
  Menu,
  Languages,
  Settings,
  FileImage,
} from "lucide-react";

export const adminNavigation = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Pages",
    path: "/admin/pages",
    icon: FileText,
  },
  {
    label: "Menus",
    path: "/admin/menus",
    icon: Menu,
  },
  {
    label: "Languages",
    path: "/admin/languages",
    icon: Languages,
  },
  {
    label: "Media",
    path: "/admin/media",
    icon: FileImage,
  }
];

export const adminBottomNavigation = [
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];