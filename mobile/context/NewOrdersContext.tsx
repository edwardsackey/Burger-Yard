import { apiFetch } from "@/api";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAdminSession } from "./AdminSession";

export type IncomingOrder = { id: number; customer: string; total: number };

type NewOrdersValue = {
  /** Real count of orders currently sitting in "New" — drives the sidebar badge. */
  newCount: number;
  /** Orders that arrived since the admin started this session — drives the alert banner. */
  incoming: IncomingOrder[];
  dismissAll: () => void;
};

const NewOrdersContext = createContext<NewOrdersValue | null>(null);

// Same cadence as the Orders screen's own poll — new enough to feel live
// without hammering the API.
const POLL_MS = 8000;

export function NewOrdersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAdminSession();
  const [newCount, setNewCount] = useState(0);
  const [incoming, setIncoming] = useState<IncomingOrder[]>([]);
  // null until the first fetch after sign-in — that first fetch just
  // records what's already there, so the admin isn't alerted about orders
  // that were sitting in the queue before they even opened the console.
  const seenIds = useRef<Set<number> | null>(null);

  useEffect(() => {
    if (!user) {
      seenIds.current = null;
      setNewCount(0);
      setIncoming([]);
      return;
    }

    let cancelled = false;

    const poll = () => {
      apiFetch("/admin/orders")
        .then((data: any[]) => {
          if (cancelled) return;
          const newOrders = data.filter((o) => o.status === "NEW");
          setNewCount(newOrders.length);

          if (seenIds.current === null) {
            seenIds.current = new Set(data.map((o) => o.id));
            return;
          }

          const arrived = newOrders.filter((o) => !seenIds.current!.has(o.id));
          if (arrived.length) {
            arrived.forEach((o) => seenIds.current!.add(o.id));
            setIncoming((prev) => [
              ...prev,
              ...arrived.map((o) => ({
                id: o.id,
                customer: o.user?.name ?? "Customer",
                total: o.total_amount,
              })),
            ]);
          }
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

  const dismissAll = () => setIncoming([]);

  return (
    <NewOrdersContext.Provider value={{ newCount, incoming, dismissAll }}>
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
