/**
 * Tokens for the admin console, taken from the "04 - Admin Desktop" frames and
 * the design system board in Figma.
 * https://www.figma.com/design/NHgpLwZNZIXF0wQJcf9QRI/Burger-Yard
 */
export const Admin = {
  red: "#D62828",
  redSoft: "#FDECEC",
  ink: "#121212",
  sidebar: "#141414",
  sidebarBorder: "#242424",
  sidebarText: "#9CA3AF",
  sidebarMuted: "#6B7280",

  canvas: "#F7F8FA",
  surface: "#FFFFFF",
  border: "#E7E9EE",
  divider: "#F1F3F6",

  text: "#111827",
  textMuted: "#6B7280",
  textFaint: "#9CA3AF",

  green: "#16A34A",
  greenSoft: "#E8F6EE",
  amber: "#D97706",
  amberSoft: "#FEF3C7",
  blue: "#2563EB",
  blueSoft: "#E6EEFD",
} as const;

/** Status pill colours, keyed by the status label used across the screens. */
export const StatusTone: Record<string, { fg: string; bg: string }> = {
  New: { fg: Admin.red, bg: Admin.redSoft },
  Preparing: { fg: Admin.amber, bg: Admin.amberSoft },
  "On the way": { fg: Admin.blue, bg: Admin.blueSoft },
  Delivered: { fg: Admin.green, bg: Admin.greenSoft },
  Cancelled: { fg: Admin.textMuted, bg: "#F3F4F6" },
  Paid: { fg: Admin.green, bg: Admin.greenSoft },
  Pending: { fg: Admin.amber, bg: Admin.amberSoft },
  Failed: { fg: Admin.red, bg: Admin.redSoft },
  Refunded: { fg: Admin.textMuted, bg: "#F3F4F6" },
};

/**
 * Layout breakpoints. The sidebar is permanent from `desktop` up and becomes a
 * slide-in drawer below it, which is what makes the console usable on a phone.
 */
export const Breakpoints = {
  /** Below this the layout goes single column and tables become cards. */
  tablet: 760,
  /** At or above this the sidebar is always visible. */
  desktop: 1080,
} as const;

export const SIDEBAR_WIDTH = 244;
