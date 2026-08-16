import type { ImageSourcePropType } from "react-native";

export type Category = "Burgers" | "Sides" | "Drinks";

export type Product = {
  id: string;
  name: string;
  category: Category;
  /** Price in GHS. */
  price: number;
  rating: string;
  desc: string;
  image: ImageSourcePropType;
};

export const CATEGORIES: Category[] = ["Burgers", "Sides", "Drinks"];

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Single Cheese Burger",
    category: "Burgers",
    price: 70,
    rating: "4.8",
    desc: "Beef patty, cheddar, lettuce, onions & yard sauce",
    image: require("@/assets/images/products/single-cheese-burger.jpg"),
  },
  {
    id: "2",
    name: "Double Cheese Burger",
    category: "Burgers",
    price: 100,
    rating: "4.9",
    desc: "Double beef patties, double cheese, caramelized onions",
    image: require("@/assets/images/products/double-cheese-burger.jpg"),
  },
  {
    id: "3",
    name: "Crispy Chicken Burger",
    category: "Burgers",
    price: 85,
    rating: "4.7",
    desc: "Crunchy fried chicken fillet, coleslaw & spicy mayo",
    image: require("@/assets/images/products/crispy-chicken-burger.jpg"),
  },
  {
    id: "4",
    name: "Loaded French Fries",
    category: "Sides",
    price: 40,
    rating: "4.6",
    desc: "Crispy golden fries topped with melted cheese and bits",
    image: require("@/assets/images/products/loaded-fries.jpg"),
  },
  {
    id: "5",
    name: "Chicken Shawarma",
    category: "Sides",
    price: 55,
    rating: "4.7",
    desc: "Grilled chicken, crunchy veg & garlic sauce in warm pita",
    image: require("@/assets/images/products/shawarma.jpg"),
  },
  {
    id: "6",
    name: "Coca-Cola (Cold)",
    category: "Drinks",
    price: 15,
    rating: "4.9",
    desc: "Chilled 500ml PET bottle",
    image: require("@/assets/images/products/coca-cola.jpg"),
  },
  {
    id: "7",
    name: "Fanta Cocktail",
    category: "Drinks",
    price: 15,
    rating: "4.8",
    desc: "Chilled 300ml refreshing soda",
    image: require("@/assets/images/products/fanta.jpg"),
  },
  {
    id: "8",
    name: "BB Fruit Cocktail",
    category: "Drinks",
    price: 18,
    rating: "4.6",
    desc: "Pineapple, apple & grape blend, served ice cold",
    image: require("@/assets/images/products/bb-cocktail.jpg"),
  },
];

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

export function getProduct(id: string): Product {
  return PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];
}

export function getProductImage(id: string): ImageSourcePropType {
  return getProduct(id).image;
}

export function formatPrice(amount: number): string {
  return `GHS ${amount}`;
}
