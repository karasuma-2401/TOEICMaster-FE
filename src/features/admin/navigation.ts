export const adminNavigation = [
  {
    label: "Tổng quan",
    icon: "▦",
    href: "/admin/overview",
    description: "Tổng quan hệ thống",
    enabled: false,
  },
  {
    label: "Người dùng",
    icon: "◉",
    href: "/admin/users",
    description: "Quản lý tài khoản TOEICMaster",
    enabled: true,
  },
  {
    label: "Kho dữ liệu",
    icon: "▤",
    href: "/admin/content/writing",
    description: "Quản lý dữ liệu và đề Writing, Speaking",
    enabled: true,
    matches: ["/admin/content", "/admin/tests"],
  },
  {
    label: "Nhật ký hoạt động",
    icon: "◷",
    href: "/admin/activity",
    description: "Theo dõi hoạt động quản trị",
    enabled: false,
  },
  {
    label: "Cài đặt hệ thống",
    icon: "⚙",
    href: "/admin/settings",
    description: "Cấu hình hệ thống",
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
