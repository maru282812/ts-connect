import type { SystemRole } from "@/types/database";

export type NavigationSurface = "user" | "admin";

export type SidebarGroupId =
  | "user-main"
  | "community"
  | "content"
  | "admin-user-main"
  | "admin-community"
  | "admin-content"
  | "admin-ops-cases"
  | "admin-ops-content"
  | "admin-ops-moderation"
  | "admin-ops-settings"
  | "master-admin";

export type NavigationItemLifecycle = "implemented" | "planned";

export type NavigationIconName =
  | "analytics"
  | "applications"
  | "archive"
  | "article"
  | "assignment"
  | "bookmark"
  | "calendar"
  | "club"
  | "dashboard"
  | "database"
  | "domain"
  | "edit"
  | "forum"
  | "gavel"
  | "goods"
  | "groups"
  | "help"
  | "history"
  | "idea"
  | "inventory"
  | "person"
  | "report"
  | "searchPerson"
  | "settings"
  | "shield"
  | "work";

export interface HeaderPartSpec {
  partName: string;
  surface: NavigationSurface;
  tone: "light" | "dark";
  structure: readonly string[];
  note: string;
}

export interface SidebarItemSpec {
  id: string;
  label: string;
  href: string;
  matchHrefs: readonly string[];
  icon: NavigationIconName;
  lifecycle: NavigationItemLifecycle;
  roles: readonly SystemRole[];
}

export interface SidebarGroupSpec {
  id: SidebarGroupId;
  partName: string;
  label: string;
  icon: NavigationIconName;
  surface: NavigationSurface;
  roles: readonly SystemRole[];
  defaultOpen: boolean;
  items: readonly SidebarItemSpec[];
}

export interface SidebarFilterOptions {
  surface: NavigationSurface;
  role: SystemRole;
  includePlanned?: boolean;
  includePlannedGroupIds?: readonly SidebarGroupId[];
}

function hasRole(roles: readonly SystemRole[], role: SystemRole): boolean {
  return roles.includes(role);
}

export const headerParts = {
  user: {
    partName: "WM-Header-UserTopBar",
    surface: "user",
    tone: "light",
    structure: [
      "brand",
      "global-search",
      "point-balance",
      "notifications",
      "help",
      "user-profile",
    ],
    note: "管理画面ヘッダーと同じ構成。色だけを一般ユーザー向けのライトトーンにする。",
  },
  admin: {
    partName: "WM-Header-AdminTopBar",
    surface: "admin",
    tone: "dark",
    structure: [
      "brand",
      "global-search",
      "point-balance",
      "notifications",
      "help",
      "user-profile",
    ],
    note: "一般ユーザー画面ヘッダーと同じ構成。色だけを管理画面向けのダークトーンにする。",
  },
} as const satisfies Record<NavigationSurface, HeaderPartSpec>;

export const sidebarGroups = [
  {
    id: "user-main",
    partName: "WM-SidebarGroup-UserPrimary",
    label: "利用メニュー",
    icon: "dashboard",
    surface: "user",
    roles: ["USER", "ADMIN", "MASTER_ADMIN"],
    defaultOpen: true,
    items: [
      {
        id: "user-posts",
        label: "案件一覧",
        href: "/app/posts",
        matchHrefs: ["/app/posts", "/app/official-posts", "/app/casual-posts"],
        icon: "work",
        lifecycle: "implemented",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "user-casual-new",
        label: "気軽に投稿",
        href: "/app/casual-posts/new",
        matchHrefs: ["/app/casual-posts/new", "/app/casual/new"],
        icon: "edit",
        lifecycle: "implemented",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "user-applications",
        label: "自分の応募",
        href: "/app/applications",
        matchHrefs: ["/app/applications"],
        icon: "assignment",
        lifecycle: "implemented",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "user-events",
        label: "社内イベントカレンダー",
        href: "/app/events",
        matchHrefs: ["/app/events"],
        icon: "calendar",
        lifecycle: "planned",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "user-bookmarks",
        label: "ブックマーク",
        href: "/app/bookmarks",
        matchHrefs: ["/app/bookmarks"],
        icon: "bookmark",
        lifecycle: "planned",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "user-my-page",
        label: "マイページ",
        href: "/app/settings",
        matchHrefs: ["/app/settings"],
        icon: "person",
        lifecycle: "implemented",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
    ],
  },
  {
    id: "community",
    partName: "WM-SidebarGroup-Community",
    label: "コミュニティ",
    icon: "groups",
    surface: "user",
    roles: ["USER", "ADMIN", "MASTER_ADMIN"],
    defaultOpen: false,
    items: [
      {
        id: "community-feed",
        label: "社内SNS",
        href: "/app/community",
        matchHrefs: ["/app/community"],
        icon: "forum",
        lifecycle: "implemented",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "employee-search",
        label: "社員検索",
        href: "/app/people",
        matchHrefs: ["/app/people"],
        icon: "searchPerson",
        lifecycle: "planned",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "clubs",
        label: "部活動",
        href: "/app/clubs",
        matchHrefs: ["/app/clubs"],
        icon: "club",
        lifecycle: "planned",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
    ],
  },
  {
    id: "content",
    partName: "WM-SidebarGroup-Content",
    label: "コンテンツ",
    icon: "inventory",
    surface: "user",
    roles: ["USER", "ADMIN", "MASTER_ADMIN"],
    defaultOpen: false,
    items: [
      {
        id: "user-my-posts",
        label: "投稿一覧",
        href: "/app/my-posts",
        matchHrefs: ["/app/my-posts"],
        icon: "article",
        lifecycle: "implemented",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "issues",
        label: "困りごと",
        href: "/app/issues",
        matchHrefs: ["/app/issues"],
        icon: "help",
        lifecycle: "implemented",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "ideas",
        label: "企画・アイデア",
        href: "/app/ideas",
        matchHrefs: ["/app/ideas"],
        icon: "idea",
        lifecycle: "implemented",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "goods",
        label: "社内グッズ",
        href: "/app/goods",
        matchHrefs: ["/app/goods"],
        icon: "goods",
        lifecycle: "planned",
        roles: ["USER", "ADMIN", "MASTER_ADMIN"],
      },
    ],
  },
  {
    id: "admin-user-main",
    partName: "WM-SidebarGroup-UserPrimary",
    label: "利用メニュー",
    icon: "dashboard",
    surface: "admin",
    roles: ["ADMIN", "MASTER_ADMIN"],
    defaultOpen: false,
    items: [
      {
        id: "admin-user-posts",
        label: "案件一覧",
        href: "/company/official-posts",
        matchHrefs: ["/company/official-posts"],
        icon: "work",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-user-casual-new",
        label: "気軽に投稿",
        href: "/company/casual-posts/new",
        matchHrefs: ["/company/casual-posts/new"],
        icon: "edit",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-user-applications",
        label: "自分の応募",
        href: "/company/my-applications",
        matchHrefs: ["/company/my-applications"],
        icon: "assignment",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-user-events",
        label: "社内イベントカレンダー",
        href: "/company/events",
        matchHrefs: ["/company/events"],
        icon: "calendar",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-user-bookmarks",
        label: "ブックマーク",
        href: "/company/bookmarks",
        matchHrefs: ["/company/bookmarks"],
        icon: "bookmark",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-user-my-page",
        label: "マイページ",
        href: "/company/my-page",
        matchHrefs: ["/company/my-page"],
        icon: "person",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
    ],
  },
  {
    id: "admin-community",
    partName: "WM-SidebarGroup-Community",
    label: "コミュニティ",
    icon: "groups",
    surface: "admin",
    roles: ["ADMIN", "MASTER_ADMIN"],
    defaultOpen: false,
    items: [
      {
        id: "admin-community-feed",
        label: "社内SNS",
        href: "/company/community",
        matchHrefs: ["/company/community"],
        icon: "forum",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-employee-search",
        label: "社員検索",
        href: "/company/people",
        matchHrefs: ["/company/people"],
        icon: "searchPerson",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-clubs",
        label: "部活動",
        href: "/company/clubs",
        matchHrefs: ["/company/clubs"],
        icon: "club",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
    ],
  },
  {
    id: "admin-content",
    partName: "WM-SidebarGroup-Content",
    label: "コンテンツ",
    icon: "inventory",
    surface: "admin",
    roles: ["ADMIN", "MASTER_ADMIN"],
    defaultOpen: false,
    items: [
      {
        id: "admin-user-my-posts",
        label: "投稿一覧",
        href: "/company/my-posts",
        matchHrefs: ["/company/my-posts"],
        icon: "article",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-content-issues",
        label: "困りごと",
        href: "/company/issues-feed",
        matchHrefs: ["/company/issues-feed"],
        icon: "help",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-content-ideas",
        label: "企画・アイデア",
        href: "/company/ideas-feed",
        matchHrefs: ["/company/ideas-feed"],
        icon: "idea",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-content-goods",
        label: "社内グッズ",
        href: "/company/goods-catalog",
        matchHrefs: ["/company/goods-catalog"],
        icon: "goods",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
    ],
  },
  {
    id: "admin-ops-cases",
    partName: "WM-SidebarGroup-AdminCases",
    label: "案件・応募管理",
    icon: "work",
    surface: "admin",
    roles: ["ADMIN", "MASTER_ADMIN"],
    defaultOpen: true,
    items: [
      {
        id: "admin-posts",
        label: "投稿管理",
        href: "/company/posts",
        matchHrefs: [
          "/company/posts",
          "/company/official-posts",
          "/company/casual-posts",
        ],
        icon: "work",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-applications",
        label: "応募管理",
        href: "/company/applications",
        matchHrefs: ["/company/applications"],
        icon: "applications",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-archive",
        label: "過去案件",
        href: "/company/archive",
        matchHrefs: ["/company/archive"],
        icon: "archive",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-rewards",
        label: "報酬・企画支援管理",
        href: "/company/rewards",
        matchHrefs: ["/company/rewards"],
        icon: "goods",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
    ],
  },
  {
    id: "admin-ops-content",
    partName: "WM-SidebarGroup-AdminContent",
    label: "コンテンツ管理",
    icon: "inventory",
    surface: "admin",
    roles: ["ADMIN", "MASTER_ADMIN"],
    defaultOpen: false,
    items: [
      {
        id: "admin-issues",
        label: "困りごと管理",
        href: "/company/issues",
        matchHrefs: ["/company/issues"],
        icon: "help",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-goods",
        label: "社内グッズ管理",
        href: "/company/goods",
        matchHrefs: ["/company/goods"],
        icon: "inventory",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-events",
        label: "社内イベントカレンダー管理",
        href: "/company/events-admin",
        matchHrefs: ["/company/events-admin"],
        icon: "calendar",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-clubs-management",
        label: "部活動管理",
        href: "/company/clubs-admin",
        matchHrefs: ["/company/clubs-admin"],
        icon: "club",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
    ],
  },
  {
    id: "admin-ops-moderation",
    partName: "WM-SidebarGroup-AdminModeration",
    label: "モデレーション",
    icon: "shield",
    surface: "admin",
    roles: ["ADMIN", "MASTER_ADMIN"],
    defaultOpen: false,
    items: [
      {
        id: "admin-ng-words",
        label: "NGワード管理",
        href: "/company/ng-words",
        matchHrefs: ["/company/ng-words"],
        icon: "gavel",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-moderation",
        label: "通報・モデレーション管理",
        href: "/company/moderation",
        matchHrefs: ["/company/moderation"],
        icon: "report",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
    ],
  },
  {
    id: "admin-ops-settings",
    partName: "WM-SidebarGroup-AdminSettings",
    label: "分析・設定",
    icon: "settings",
    surface: "admin",
    roles: ["ADMIN", "MASTER_ADMIN"],
    defaultOpen: false,
    items: [
      {
        id: "admin-dashboard",
        label: "ダッシュボード",
        href: "/company/dashboard",
        matchHrefs: ["/company/dashboard"],
        icon: "dashboard",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-analytics",
        label: "分析・行動ログ",
        href: "/company/analytics",
        matchHrefs: ["/company/analytics"],
        icon: "analytics",
        lifecycle: "planned",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
      {
        id: "admin-settings",
        label: "管理設定",
        href: "/company/settings",
        matchHrefs: ["/company/settings"],
        icon: "settings",
        lifecycle: "implemented",
        roles: ["ADMIN", "MASTER_ADMIN"],
      },
    ],
  },
  {
    id: "master-admin",
    partName: "WM-SidebarGroup-MasterAdmin",
    label: "マスター管理",
    icon: "database",
    surface: "admin",
    roles: ["MASTER_ADMIN"],
    defaultOpen: false,
    items: [
      {
        id: "master-users",
        label: "ユーザー権限管理",
        href: "/company/master/users",
        matchHrefs: ["/company/master/users"],
        icon: "shield",
        lifecycle: "planned",
        roles: ["MASTER_ADMIN"],
      },
      {
        id: "master-companies",
        label: "会社・部署マスター管理",
        href: "/company/master/companies",
        matchHrefs: ["/company/master/companies"],
        icon: "domain",
        lifecycle: "planned",
        roles: ["MASTER_ADMIN"],
      },
      {
        id: "master-audit-logs",
        label: "監査ログ",
        href: "/company/master/audit-logs",
        matchHrefs: ["/company/master/audit-logs"],
        icon: "history",
        lifecycle: "planned",
        roles: ["MASTER_ADMIN"],
      },
      {
        id: "master-system-settings",
        label: "システム設定",
        href: "/company/master/system-settings",
        matchHrefs: ["/company/master/system-settings"],
        icon: "settings",
        lifecycle: "planned",
        roles: ["MASTER_ADMIN"],
      },
    ],
  },
] as const satisfies readonly SidebarGroupSpec[];

export function getSidebarGroups({
  surface,
  role,
  includePlanned = false,
  includePlannedGroupIds = [],
}: SidebarFilterOptions): SidebarGroupSpec[] {
  return sidebarGroups
    .filter((group) => group.surface === surface && hasRole(group.roles, role))
    .map((group) => {
      const showPlanned =
        includePlanned || includePlannedGroupIds.includes(group.id);
      return {
        ...group,
        items: group.items.filter(
          (item) =>
            hasRole(item.roles, role) &&
            (showPlanned || item.lifecycle === "implemented"),
        ),
      };
    })
    .filter((group) => group.items.length > 0);
}
