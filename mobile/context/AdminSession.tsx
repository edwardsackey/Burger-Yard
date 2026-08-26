import { apiFetch, deleteToken, saveToken } from "@/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Role = "owner" | "staff";

export type AdminUser = {
  name: string;
  role: Role;
  /** Shown under the name in the sidebar. */
  title: string;
  initials: string;
  /** Only set for staff, so a session can be tied back to its record. */
  staffId?: number;
};

/** A worker the owner has onboarded. */
export type StaffMember = {
  id: number;
  name: string;
  phone: string;
  active: boolean;
  invitedAt: string;
};

/** Name-only, fetched before anyone is signed in — for the staff picker. */
export type ActiveStaffOption = { id: number; name: string };

/**
 * Screens only the owner may open. Everything not listed is open to staff.
 *
 * Single source of truth: the sidebar, the route guard and the landing
 * redirect all read it, so a screen cannot be hidden in one place and left
 * reachable in another.
 */
export const OWNER_ONLY = ["dashboard", "reports", "payments"] as const;

export const HOME_FOR: Record<Role, string> = {
  owner: "/(admin)/dashboard",
  staff: "/(admin)/orders",
};

export function canAccess(role: Role, screen: string): boolean {
  if (role === "owner") return true;
  return !OWNER_ONLY.includes(screen as (typeof OWNER_ONLY)[number]);
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type SignInResult = { ok: boolean; error?: string };

type SessionValue = {
  user: AdminUser | null;
  staff: StaffMember[];
  /** Only active members can be picked on the staff sign-in screen. */
  activeStaff: ActiveStaffOption[];
  signInOwner: (email: string, password: string) => Promise<SignInResult>;
  signInStaff: (staffId: number, pin: string) => Promise<SignInResult>;
  signOut: () => void;
  can: (screen: string) => boolean;
  loadStaff: () => Promise<void>;
  addStaff: (name: string, phone: string) => Promise<{ member: StaffMember; pin: string } | null>;
  updateStaff: (id: number, patch: Partial<Pick<StaffMember, "name" | "phone" | "active">>) => Promise<void>;
  removeStaff: (id: number) => Promise<void>;
  regeneratePin: (id: number) => Promise<string | null>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  // Starts signed OUT deliberately. Defaulting to a signed-in owner would mean
  // a reload silently promotes whoever is at the keyboard.
  const [user, setUser] = useState<AdminUser | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activeStaff, setActiveStaff] = useState<ActiveStaffOption[]>([]);

  // Public — the staff picker needs names before anyone is authenticated.
  useEffect(() => {
    apiFetch("/admin/auth/active-staff")
      .then(setActiveStaff)
      .catch(() => {
        // Backend unreachable — the picker just shows nobody to choose.
      });
  }, []);

  const signInOwner = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    try {
      const data = await apiFetch("/admin/auth/owner-login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      await saveToken(data.token);
      setUser({
        name: data.name,
        role: "owner",
        title: "Owner",
        initials: initialsOf(data.name),
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Please try again." };
    }
  }, []);

  const signInStaff = useCallback(async (staffId: number, pin: string): Promise<SignInResult> => {
    try {
      const data = await apiFetch("/admin/auth/staff-login", {
        method: "POST",
        body: JSON.stringify({ staffId, pin: pin.trim() }),
      });
      await saveToken(data.token);
      setUser({
        name: data.name,
        role: "staff",
        title: "Kitchen staff",
        initials: initialsOf(data.name),
        staffId,
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Please try again." };
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    deleteToken();
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const data = await apiFetch("/admin/staff");
      setStaff(data);
    } catch {
      // Not signed in as owner, or request failed — leave the list as-is.
    }
  }, []);

  const addStaff = useCallback(async (name: string, phone: string) => {
    try {
      const data = await apiFetch("/admin/staff", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const { pin, ...member } = data;
      setStaff((prev) => [...prev, member]);
      return { member, pin };
    } catch {
      return null;
    }
  }, []);

  const updateStaff = useCallback(
    async (id: number, patch: Partial<Pick<StaffMember, "name" | "phone" | "active">>) => {
      try {
        const data = await apiFetch(`/admin/staff/${id}`, {
          method: "PUT",
          body: JSON.stringify(patch),
        });
        setStaff((prev) => prev.map((s) => (s.id === id ? data : s)));
      } catch {
        // Left as-is — the screen's own error handling covers this.
      }
    },
    [],
  );

  const removeStaff = useCallback(async (id: number) => {
    try {
      await apiFetch(`/admin/staff/${id}`, { method: "DELETE" });
      setStaff((prev) => prev.filter((s) => s.id !== id));
      // If that person is signed in on this device, drop them out too.
      setUser((current) => (current?.staffId === id ? null : current));
    } catch {
      // Left as-is — the screen's own error handling covers this.
    }
  }, []);

  const regeneratePin = useCallback(async (id: number) => {
    try {
      const data = await apiFetch(`/admin/staff/${id}/regenerate-pin`, { method: "POST" });
      return data.pin as string;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      staff,
      activeStaff,
      signInOwner,
      signInStaff,
      signOut,
      can: (screen: string) => (user ? canAccess(user.role, screen) : false),
      loadStaff,
      addStaff,
      updateStaff,
      removeStaff,
      regeneratePin,
    }),
    [
      user,
      staff,
      activeStaff,
      signInOwner,
      signInStaff,
      signOut,
      loadStaff,
      addStaff,
      updateStaff,
      removeStaff,
      regeneratePin,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAdminSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useAdminSession must be used inside AdminSessionProvider");
  }
  return value;
}
