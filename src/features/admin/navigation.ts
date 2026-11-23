export const adminNavigation = [
  {
    label: "Overview",
    icon: "▦",
    href: "/admin/overview",
    description: "System overview",
    enabled: false,
  },
  {
    label: "Users",
    icon: "◉",
    href: "/admin/users",
    description: "Manage TOEICMaster accounts",
    enabled: true,
  },
  {
    label: "Data Bank",
    icon: "▤",
    href: "/admin/exams",
    description: "Manage TOEIC exercise bank and exams",
    enabled: true,
    matches: ["/admin/content", "/admin/exams", "/admin/tests"],
  },
  {
    label: "Knowledge",
    icon: "✎",
    href: "/admin/knowledge",
    description: "Manage knowledge articles, categories, and image library",
    enabled: true,
    matches: ["/admin/knowledge"],
  },
  {
    label: "Activity Log",
    icon: "◷",
    href: "/admin/activity",
    description: "Monitor administrative activity",
    enabled: false,
  },
  {
    label: "System Settings",
    icon: "⚙",
    href: "/admin/settings",
    description: "System configuration",
    enabled: false,
  },
] as const;

export function getAdminNavigationItem(pathname: string) {
  const isUnder = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);
  return [...adminNavigation]
    .filter(
      (item) =>
        isUnder(item.href) ||
        ("matches" in item && item.matches.some((path) => isUnder(path))),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}
