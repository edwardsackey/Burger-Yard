export type OrderStatus = "Active" | "Completed";

export type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  items: string;
  /** Total in GHS. */
  total: number;
};

/** Past orders. Shared so the You tab can count them without duplicating. */
export const ORDERS: Order[] = [
  {
    id: "1042",
    date: "Today, 12:09",
    status: "Active",
    items: "2x Single Cheese Burger (+Bacon), Chicken Burger, Coca-Cola",
    total: 195,
  },
  {
    id: "1037",
    date: "Yesterday",
    status: "Completed",
    items: "Single Cheese Burger, Fries Regular, Coca-Cola",
    total: 105,
  },
  {
    id: "1031",
    date: "12 Aug",
    status: "Completed",
    items: "Double Cheese Burger, Loaded French Fries",
    total: 140,
  },
];
