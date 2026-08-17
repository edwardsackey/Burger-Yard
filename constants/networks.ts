export type NetworkId = "mtn" | "telecel" | "at";

export type Network = {
  id: NetworkId;
  label: string;
  dot: string;
  /** National prefixes, written with the leading zero. */
  prefixes: string[];
};

export const NETWORKS: Network[] = [
  {
    id: "mtn",
    label: "MTN",
    dot: "🟡",
    prefixes: ["024", "025", "053", "054", "055", "059"],
  },
  {
    id: "telecel",
    label: "Telecel",
    dot: "🔴",
    prefixes: ["020", "050"],
  },
  {
    id: "at",
    label: "AT",
    dot: "🔵",
    prefixes: ["026", "027", "056", "057"],
  },
];

export function networkLabel(id: NetworkId): string {
  return NETWORKS.find((n) => n.id === id)?.label ?? id;
}

/**
 * Reduces anything the user might type to the national 0XX form: strips
 * spaces and dashes, and turns +233 / 233 into a leading zero.
 */
export function normalisePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("233")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0")) return digits;
  // a bare 9 digit number is missing its leading zero
  return digits.length === 9 ? `0${digits}` : digits;
}

/** The network a number belongs to, or null while it is still too short. */
export function detectNetwork(input: string): NetworkId | null {
  const national = normalisePhone(input);
  if (national.length < 3) return null;
  const prefix = national.slice(0, 3);
  return NETWORKS.find((n) => n.prefixes.includes(prefix))?.id ?? null;
}

/** A complete Ghanaian mobile number is 10 digits in national form. */
export function isCompletePhone(input: string): boolean {
  return normalisePhone(input).length === 10;
}
