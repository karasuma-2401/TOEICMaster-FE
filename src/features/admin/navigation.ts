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
    icon: "▣",
    href: "/admin/exams",
    description: "Quản lý bài tập và đề Listening & Reading",
    enabled: true,
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
  return [...adminNavigation]
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}
