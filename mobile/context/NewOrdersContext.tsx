import { apiFetch } from "@/api";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAdminSession } from "./AdminSession";

export type AdminAlert =
  | { kind: "order"; id: number; customer: string; total: number }
  | { kind: "payment"; id: number; customer: string; total: number; method: string };

type NewOrdersValue = {
  /** Real count of orders currently sitting in "New" — drives the sidebar badge. */
  newCount: number;
  /** New orders and payment confirmations since the admin started this
   * session — drives the alert banner. */
  alerts: AdminAlert[];
  dismissAll: () => void;
};

const NewOrdersContext = createContext<NewOrdersValue | null>(null);

const PAYMENT_METHOD_LABEL: Record<string, string> = { MOMO: "MoMo", CARD: "Card", CASH: "Cash" };

// Same cadence as the Orders screen's own poll — new enough to feel live
// without hammering the API.
const POLL_MS = 8000;

export function NewOrdersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAdminSession();
  const [newCount, setNewCount] = useState(0);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  // Both null until the first fetch after sign-in — that first fetch just
  // records what's already there, so the admin isn't alerted about orders
  // (or payments) that already existed before they opened the console.
  const seenOrderIds = useRef<Set<number> | null>(null);
  const seenPaidIds = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (!user) {
      seenOrderIds.current = null;
      seenPaidIds.current = null;
      setNewCount(0);
      setAlerts([]);
      return;
    }

    let cancelled = false;

    const poll = () => {
      apiFetch("/admin/orders")
        .then((data: any[]) => {
          if (cancelled) return;
          const newOrders = data.filter((o) => o.status === "NEW");
          setNewCount(newOrders.length);

          if (seenOrderIds.current === null) {
            seenOrderIds.current = new Set(data.map((o) => o.id));
            seenPaidIds.current = new Set(data.filter((o) => o.paid).map((o) => o.id));
            return;
          }

          const fresh: AdminAlert[] = [];

          const arrivedOrders = newOrders.filter((o) => !seenOrderIds.current!.has(o.id));
          arrivedOrders.forEach((o) => {
            seenOrderIds.current!.add(o.id);
            fresh.push({
              kind: "order",
              id: o.id,
              customer: o.user?.name ?? "Customer",
              total: o.total_amount,
            });
          });

          // Cash orders never flip this — only a real Paystack confirmation
          // (MoMo/Card) sets paid:true, so this only ever fires for those.
          const justPaid = data.filter((o) => o.paid && !seenPaidIds.current!.has(o.id));
          justPaid.forEach((o) => {
            seenPaidIds.current!.add(o.id);
            fresh.push({
              kind: "payment",
              id: o.id,
              customer: o.user?.name ?? "Customer",
              total: o.total_amount,
              method: PAYMENT_METHOD_LABEL[o.paymentMethod] ?? o.paymentMethod,
            });
          });

          if (fresh.length) setAlerts((prev) => [...prev, ...fresh]);
        })
        .catch(() => {
          // Transient network hiccup — the next poll retries.
        });
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const dismissAll = () => setAlerts([]);

  return (
    <NewOrdersContext.Provider value={{ newCount, alerts, dismissAll }}>
      {children}
    </NewOrdersContext.Provider>
  );
}

export function useNewOrders() {
  const value = useContext(NewOrdersContext);
  if (!value) {
    throw new Error("useNewOrders must be used inside NewOrdersProvider");
  }
  return value;
}
