import { Breakpoints } from "@/constants/admin-theme";
import { useWindowDimensions } from "react-native";

export type Layout = {
  width: number;
  height: number;
  /** Phone width: single column, tables collapse to cards. */
  isPhone: boolean;
  /** Between phone and desktop: two column grids, drawer still overlays. */
  isTablet: boolean;
  /** Sidebar is permanent from here up. */
  isDesktop: boolean;
  /** Columns for the stat card grid. */
  statColumns: number;
};

/**
 * One place that decides how wide we are, so every admin screen agrees on it
 * instead of each inventing its own threshold.
 */
export function useResponsive(): Layout {
  const { width, height } = useWindowDimensions();

  const isDesktop = width >= Breakpoints.desktop;
  const isPhone = width < Breakpoints.tablet;
  const isTablet = !isPhone && !isDesktop;

  return {
    width,
    height,
    isPhone,
    isTablet,
    isDesktop,
    statColumns: isDesktop ? 4 : isTablet ? 2 : 1,
  };
}
