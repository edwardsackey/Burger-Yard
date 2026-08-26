import React, {
  createContext,
  useCallback,
  useContext,
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
  staffId?: string;
};

/** A worker the owner has onboarded. */
export type StaffMember = {
  id: string;
  name: string;
  phone: string;
  /** Four digits, unique across the team. Their only credential. */
  code: string;
  active: boolean;
  invitedOn: string;
};

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

/**
 * The owner has two sign-ins: the everyday one and a standby used for
 * recovery. Both carry identical access - the second exists so a lost
 * password on the first does not lock the business out of its own console.
 */
export const OWNER_LOGINS = {
  primary: "owner@burgeryard.com",
  recovery: "recovery@burgeryard.com",
} as const;

const OWNER_PASSWORDS: Record<string, string> = {
  [OWNER_LOGINS.primary]: "owner123",
  [OWNER_LOGINS.recovery]: "recovery123",
};

const OWNER_USER: AdminUser = {
  name: "Kojo Asante",
  role: "owner",
  title: "Owner · Ayeduase",
  initials: "KA",
};

const SEED_STAFF: StaffMember[] = [
  { id: "s1", name: "Ama Boakye", phone: "0244112233", code: "4821", active: true, invitedOn: "12 Aug" },
  { id: "s2", name: "Kwame Nkansah", phone: "0201445566", code: "7390", active: true, invitedOn: "14 Aug" },
  { id: "s3", name: "Efua Danso", phone: "0553778899", code: "2065", active: true, invitedOn: "16 Aug" },
];

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
  activeStaff: StaffMember[];
  signInOwner: (email: string, password: string) => SignInResult;
  signInStaff: (staffId: string, code: string) => SignInResult;
  signOut: () => void;
  can: (screen: string) => boolean;
  addStaff: (name: string, phone: string) => StaffMember | null;
  updateStaff: (id: string, patch: Partial<StaffMember>) => void;
  removeStaff: (id: string) => void;
  regenerateCode: (id: string) => string | null;
};

const SessionContext = createContext<SessionValue | null>(null);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  // Starts signed OUT deliberately. Defaulting to a signed-in owner would mean
  // a reload silently promotes whoever is at the keyboard.
  const [user, setUser] = useState<AdminUser | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>(SEED_STAFF);

  /** Four digits that no current member already holds. */
  const freshCode = useCallback(
    (taken: StaffMember[]) => {
      const used = new Set(taken.map((s) => s.code));
      for (let i = 0; i < 500; i++) {
        const code = String(Math.floor(1000 + Math.random() * 9000));
        if (!used.has(code)) return code;
      }
      return null;
    },
    [],
  );

  const signInOwner = useCallback((email: string, password: string): SignInResult => {
    const key = email.trim().toLowerCase();
    const expected = OWNER_PASSWORDS[key];
    if (!expected || expected !== password) {
      return { ok: false, error: "That email and password do not match." };
    }
    setUser(OWNER_USER);
    return { ok: true };
  }, []);

  const signInStaff = useCallback(
    (staffId: string, code: string): SignInResult => {
      const member = staff.find((s) => s.id === staffId);
      if (!member) return { ok: false, error: "Pick your name to continue." };
      if (!member.active) {
        return { ok: false, error: "That account is no longer active. Ask the owner." };
      }
      // Checked against this member's own code only, so one worker's code
      // cannot sign in as another.
      if (member.code !== code.trim()) {
        return { ok: false, error: "That code is not right for this name." };
      }
      setUser({
        name: member.name,
        role: "staff",
        title: "Kitchen staff · Ayeduase",
        initials: initialsOf(member.name),
        staffId: member.id,
      });
      return { ok: true };
    },
    [staff],
  );

  const signOut = useCallback(() => setUser(null), []);

  const addStaff = useCallback(
    (name: string, phone: string) => {
      let created: StaffMember | null = null;
      setStaff((prev) => {
        const code = freshCode(prev);
        if (!code) return prev;
        created = {
          id: `s${Date.now()}`,
          name: name.trim(),
          phone: phone.trim(),
          code,
          active: true,
          invitedOn: new Date().toLocaleDateString([], { day: "numeric", month: "short" }),
        };
        return [...prev, created];
      });
      return created;
    },
    [freshCode],
  );

  const updateStaff = useCallback((id: string, patch: Partial<StaffMember>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const removeStaff = useCallback(
    (id: string) => {
      setStaff((prev) => prev.filter((s) => s.id !== id));
      // If that person is signed in on this device, drop them out too.
      setUser((current) => (current?.staffId === id ? null : current));
    },
    [],
  );

  const regenerateCode = useCallback(
    (id: string) => {
      let next: string | null = null;
      setStaff((prev) => {
        const code = freshCode(prev.filter((s) => s.id !== id));
        if (!code) return prev;
        next = code;
        return prev.map((s) => (s.id === id ? { ...s, code } : s));
      });
      return next;
    },
    [freshCode],
  );

  const value = useMemo<SessionValue>(
    () => ({
      user,
      staff,
      activeStaff: staff.filter((s) => s.active),
      signInOwner,
      signInStaff,
      signOut,
      can: (screen: string) => (user ? canAccess(user.role, screen) : false),
      addStaff,
      updateStaff,
      removeStaff,
      regenerateCode,
    }),
    [user, staff, signInOwner, signInStaff, signOut, addStaff, updateStaff, removeStaff, regenerateCode],
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
