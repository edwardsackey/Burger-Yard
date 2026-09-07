import { resolveUploadUrl } from "@/api";
import { PLACEHOLDER_IMAGE } from "@/constants/menu-catalog";
import type { ImageSourcePropType } from "react-native";

/** Real menu categories are whatever the admin typed — not a fixed set. */
export type Category = string;

export type Product = {
  id: string;
  name: string;
  category: Category;
  /** Price in GHS. */
  price: number;
  rating: string;
  desc: string;
  image: ImageSourcePropType;
  /**
   * How the photo should sit in a frame. The plated shots fill the frame, but
   * the packshots are a single object floating on white - cropping those cuts
   * the bottle off, so they are letterboxed instead.
   */
  fit: "cover" | "contain";
  /**
   * Whether the extras list applies. The extras are burger toppings, so they
   * are offered on the burgers and the wrap but not on chips or drinks.
   */
  allowsExtras: boolean;
};

export const CATEGORIES: Category[] = ["Burgers", "Sides", "Drinks"];

/**
 * The combo advertised on the home banner. It is a real catalog entry so the
 * price on the banner and the price on its detail screen cannot drift apart.
 */
export const DEAL_ID = "9";

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Single Cheese Burger",
    category: "Burgers",
    price: 70,
    rating: "4.8",
    desc: "Beef patty, cheddar, lettuce, onions & yard sauce",
    image: require("@/assets/images/products/single-cheese-burger.jpg"),
    fit: "cover",
    allowsExtras: true,
  },
  {
    id: "2",
    name: "Double Cheese Burger",
    category: "Burgers",
    price: 100,
    rating: "4.9",
    desc: "Double beef patties, double cheese, caramelized onions",
    image: require("@/assets/images/products/double-cheese-burger.jpg"),
    fit: "cover",
    allowsExtras: true,
  },
  {
    id: "3",
    name: "Crispy Chicken Burger",
    category: "Burgers",
    price: 70,
    rating: "4.7",
    desc: "Crunchy fried chicken fillet, coleslaw & spicy mayo",
    image: require("@/assets/images/products/crispy-chicken-burger.jpg"),
    fit: "cover",
    allowsExtras: true,
  },
  {
    id: "4",
    name: "French Fries",
    category: "Sides",
    price: 25,
    rating: "4.6",
    desc: "Crispy golden fries, lightly salted",
    image: require("@/assets/images/products/loaded-fries.jpg"),
    fit: "contain",
    allowsExtras: false,
  },
  {
    id: "5",
    name: "Chicken Shawarma",
    category: "Sides",
    price: 50,
    rating: "4.7",
    desc: "Grilled chicken, crunchy veg & garlic sauce in warm pita",
    image: require("@/assets/images/products/shawarma.jpg"),
    fit: "contain",
    allowsExtras: true,
  },
  {
    id: "6",
    name: "Coca-Cola (Cold)",
    category: "Drinks",
    price: 10,
    rating: "4.9",
    desc: "Chilled 500ml PET bottle",
    image: require("@/assets/images/products/coca-cola.jpg"),
    fit: "contain",
    allowsExtras: false,
  },
  {
    id: "7",
    name: "Fanta Cocktail",
    category: "Drinks",
    price: 10,
    rating: "4.8",
    desc: "Chilled 300ml refreshing soda",
    image: require("@/assets/images/products/fanta.jpg"),
    fit: "contain",
    allowsExtras: false,
  },
  {
    id: "8",
    name: "BB Fruit Cocktail",
    category: "Drinks",
    price: 15,
    rating: "4.6",
    desc: "Pineapple, apple & grape blend, served ice cold",
    image: require("@/assets/images/products/bb-cocktail.jpg"),
    fit: "contain",
    allowsExtras: false,
  },
  {
    id: DEAL_ID,
    name: "Double Yard Deal",
    category: "Burgers",
    price: 180,
    rating: "4.9",
    desc: "2x Double Cheese Burger + Large Fries, saving GHS 45",
    image: require("@/assets/images/products/double-cheese-burger.jpg"),
    fit: "cover",
    allowsExtras: true,
  },
];

/** Optional add-ons offered on the product detail screen, in GHS. */
export const EXTRAS: { name: string; price: number }[] = [
  { name: "Bacon", price: 15 },
  { name: "Sausage", price: 8 },
  { name: "Extra Egg", price: 8 },
  { name: "Extra Cheese", price: 15 },
  { name: "Extra Patty", price: 25 },
  { name: "Coca-Cola", price: 10 },
];

export const EXTRAS_PRICES: Record<string, number> = Object.fromEntries(
  EXTRAS.map((e) => [e.name, e.price]),
);

/** Marketing artwork used by the home banner and promo rail. */
export const PROMO_IMAGES = {
  hunger: require("@/assets/images/promo-hunger.jpg"),
  bite: require("@/assets/images/promo-bite.jpg"),
} as const;

export const BRAND_IMAGES = {
  logo: require("@/assets/images/logo.png"),
  hero: require("@/assets/images/hero-burger.jpg"),
  /** Pre-cropped circular burger used by the loading screen. */
  loadingBurger: require("@/assets/images/burger-round.png"),
} as const;

// Real menu from the backend, once it's loaded — everything below reads
// through this instead of the static PRODUCTS array once it's populated.
// getProduct/addItem/etc. all stay synchronous, since they're called from
// button presses that can't await a fetch — setLiveMenu is called once
// from AppStoreProvider on mount, and the static array covers the brief
// window (or offline case) before that resolves.
let liveProducts: Product[] | null = null;

type ApiMenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
};

// The 9 seeded items share ids AND names with PRODUCTS by design (see
// prisma/seed.ts) — reuse this app's own real photography for those
// rather than a placeholder, matched by id first (authoritative) and by
// name as a backup (survives an id drift, e.g. a reseed).
const STATIC_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));
const STATIC_BY_NAME = new Map(PRODUCTS.map((p) => [p.name.trim().toLowerCase(), p]));

export function setLiveMenu(items: ApiMenuItem[]): void {
  liveProducts = items.map((it) => {
    const known = STATIC_BY_ID.get(String(it.id)) ?? STATIC_BY_NAME.get(it.name.trim().toLowerCase());
    return {
      id: String(it.id),
      name: it.name,
      category: it.category ?? "Uncategorized",
      price: it.price,
      rating: "4.8",
      desc: it.description ?? "",
      image: it.image_url ? { uri: resolveUploadUrl(it.image_url)! } : (known?.image ?? PLACEHOLDER_IMAGE),
      fit: known?.fit ?? "cover",
      // No per-item flag on the backend for this yet — drinks just don't
      // take burger toppings, everything else reasonably might.
      allowsExtras: (it.category ?? "").toLowerCase() !== "drinks",
    };
  });
}

export function getProducts(): Product[] {
  return liveProducts ?? PRODUCTS;
}

export function getCategories(): string[] {
  return [...new Set(getProducts().map((p) => p.category))];
}

export function getProduct(id: string): Product {
  const list = getProducts();
  return list.find((p) => p.id === id) ?? list[0] ?? PRODUCTS[0];
}

/** Unlike getProduct, this doesn't fall back to *some* product when the id
 * isn't in the live menu — that's exactly the case the cart needs to detect
 * (e.g. the item went out of stock after it was added). */
export function findProduct(id: string): Product | null {
  return getProducts().find((p) => p.id === id) ?? null;
}

/** The banner combo, so its copy and its detail screen read from one source.
 * Falls back to the first real item if the seeded id isn't in the live menu
 * (e.g. it was ever deleted) rather than crashing the home screen. */
export function getDeal(): Product {
  return getProducts().find((p) => p.id === DEAL_ID) ?? getProducts()[0] ?? PRODUCTS[0];
}

export function getProductImage(id: string): ImageSourcePropType {
  return getProduct(id).image;
}

export function formatPrice(amount: number): string {
  return `GHS ${amount}`;
}
