import { EXTRAS_PRICES, getProduct } from "@/constants/catalog";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export const DELIVERY_FEE = 25;

/**
 * A cart line is a product plus a specific set of extras. Adding the same
 * burger twice with different extras has to stay two lines, so the identity
 * is the product id combined with its sorted extras rather than the id alone.
 */
export type CartLine = {
  key: string;
  productId: string;
  name: string;
  extras: string[];
  quantity: number;
  unitPrice: number;
};

type CartValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addItem: (productId: string, extras?: string[], quantity?: number) => void;
  changeQuantity: (key: string, delta: number) => void;
  clear: () => void;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

type NotificationsValue = {
  items: AppNotification[];
  unreadCount: number;
  notify: (title: string, body: string) => void;
  markAllRead: () => void;
};

/** Whatever the user told us at sign in or sign up, reused everywhere after. */
export type Account = {
  name: string;
  /** National form, as typed, e.g. "054 392 7440". */
  phone: string;
};

/** Only what is needed to show a saved card back to its owner. */
export type SavedCard = {
  last4: string;
  expiry: string;
  holder: string;
};

type AccountValue = {
  account: Account;
  setAccount: (next: Partial<Account>) => void;
  card: SavedCard | null;
  setCard: (card: SavedCard | null) => void;
};

/** Where this order goes — picked from a saved address or the map. */
export type DeliveryLocation = {
  label: string;
  city: string;
  landmark: string;
  latitude: number;
  longitude: number;
};

type DeliveryLocationValue = {
  deliveryLocation: DeliveryLocation | null;
  setDeliveryLocation: (location: DeliveryLocation) => void;
};

const CartContext = createContext<CartValue | null>(null);
const NotificationsContext = createContext<NotificationsValue | null>(null);
const AccountContext = createContext<AccountValue | null>(null);
const DeliveryLocationContext = createContext<DeliveryLocationValue | null>(null);

function lineKey(productId: string, extras: string[]) {
  return extras.length ? `${productId}::${[...extras].sort().join("+")}` : productId;
}

function clockLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  // Both start empty. Nothing is in the cart or the inbox until the user
  // actually does something.
  const [lines, setLines] = useState<CartLine[]>([]);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [account, setAccountState] = useState<Account>({ name: "", phone: "" });
  const [card, setCard] = useState<SavedCard | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);

  const setAccount = useCallback((next: Partial<Account>) => {
    setAccountState((prev) => ({ ...prev, ...next }));
  }, []);

  const addItem = useCallback(
    (productId: string, extras: string[] = [], quantity = 1) => {
      const product = getProduct(productId);
      const extrasTotal = extras.reduce(
        (sum, name) => sum + (EXTRAS_PRICES[name] ?? 0),
        0,
      );
      const key = lineKey(productId, extras);

      setLines((prev) => {
        const existing = prev.find((l) => l.key === key);
        if (existing) {
          return prev.map((l) =>
            l.key === key ? { ...l, quantity: l.quantity + quantity } : l,
          );
        }
        return [
          ...prev,
          {
            key,
            productId,
            name: product.name,
            extras,
            quantity,
            unitPrice: product.price + extrasTotal,
          },
        ];
      });
    },
    [],
  );

  const changeQuantity = useCallback((key: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const notify = useCallback((title: string, body: string) => {
    setItems((prev) => [
      {
        id: `${Date.now()}-${prev.length}`,
        title,
        body,
        time: clockLabel(),
        read: false,
      },
      ...prev,
    ]);
  }, []);

  const markAllRead = useCallback(
    () => setItems((prev) => prev.map((n) => ({ ...n, read: true }))),
    [],
  );

  const cart = useMemo<CartValue>(() => {
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
    return {
      lines,
      itemCount,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      addItem,
      changeQuantity,
      clear,
    };
  }, [lines, addItem, changeQuantity, clear]);

  const notifications = useMemo<NotificationsValue>(
    () => ({
      items,
      unreadCount: items.filter((n) => !n.read).length,
      notify,
      markAllRead,
    }),
    [items, notify, markAllRead],
  );

  const accountValue = useMemo<AccountValue>(
    () => ({ account, setAccount, card, setCard }),
    [account, setAccount, card],
  );

  const deliveryLocationValue = useMemo<DeliveryLocationValue>(
    () => ({ deliveryLocation, setDeliveryLocation }),
    [deliveryLocation],
  );

  return (
    <AccountContext.Provider value={accountValue}>
      <DeliveryLocationContext.Provider value={deliveryLocationValue}>
        <CartContext.Provider value={cart}>
          <NotificationsContext.Provider value={notifications}>
            {children}
          </NotificationsContext.Provider>
        </CartContext.Provider>
      </DeliveryLocationContext.Provider>
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AppStoreProvider");
  return value;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside AppStoreProvider");
  return value;
}

export function useNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) {
    throw new Error("useNotifications must be used inside AppStoreProvider");
  }
  return value;
}

export function useDeliveryLocation() {
  const value = useContext(DeliveryLocationContext);
  if (!value) {
    throw new Error("useDeliveryLocation must be used inside AppStoreProvider");
  }
  return value;
}
