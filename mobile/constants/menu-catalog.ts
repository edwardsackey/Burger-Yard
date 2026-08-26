import type { ImageSourcePropType } from "react-native";

export const BRAND = {
  logo: require("@/assets/images/logo.png"),
  hero: require("@/assets/images/hero-burger.jpg"),
} as const;

/**
 * Photographs for the menu, keyed by item id so orders, the dashboard and the
 * menu screen all show the same picture for the same thing.
 */
export const MENU_IMAGES: Record<string, ImageSourcePropType> = {
  "1": require("@/assets/images/menu/single-cheese-burger.jpg"),
  "2": require("@/assets/images/menu/double-cheese-burger.jpg"),
  "3": require("@/assets/images/menu/chicken-burger.jpg"),
  "4": require("@/assets/images/menu/fries.jpg"),
  "5": require("@/assets/images/menu/fries.jpg"),
  "6": require("@/assets/images/menu/coca-cola.jpg"),
  "7": require("@/assets/images/menu/bacon.jpg"),
  "8": require("@/assets/images/menu/cheese.jpg"),
  "9": require("@/assets/images/menu/patty.jpg"),
};

/** Fallback so a newly added item still renders something. */
export const PLACEHOLDER_IMAGE = require("@/assets/images/menu/bun.jpg");

export function menuImage(id: string): ImageSourcePropType {
  return MENU_IMAGES[id] ?? PLACEHOLDER_IMAGE;
}

/** By name, for screens that only carry the item's label (orders, reports). */
const BY_NAME: Record<string, ImageSourcePropType> = {
  "single cheese burger": MENU_IMAGES["1"],
  "double cheese burger": MENU_IMAGES["2"],
  "chicken burger": MENU_IMAGES["3"],
  "chicken burger x fries": MENU_IMAGES["4"],
  "fries regular": MENU_IMAGES["5"],
  "coca-cola": MENU_IMAGES["6"],
  bacon: MENU_IMAGES["7"],
  "extra cheese": MENU_IMAGES["8"],
  "extra patty": MENU_IMAGES["9"],
};

export function imageForName(name: string): ImageSourcePropType {
  return BY_NAME[name.trim().toLowerCase()] ?? PLACEHOLDER_IMAGE;
}
