import type { ImageSourcePropType } from "react-native";

export type NetworkId = "mtn" | "telecel" | "at";

export type Network = {
  id: NetworkId;
  label: string;
  /** What the provider calls its wallet, for the payment method list. */
  wallet: string;
  /**
   * The provider's own logo. Each one is pre-cropped to 3:2 with its brand
   * background already in the artwork, so the tiles line up at one size and
   * the provider is recognised without reading the name.
   */
  logo: ImageSourcePropType;
  /** National prefixes, written with the leading zero. */
  prefixes: string[];
};

export const NETWORKS: Network[] = [
  {
    id: "mtn",
    label: "MTN",
    wallet: "MTN Mobile Money",
    logo: require("@/assets/images/networks/mtn.png"),
    prefixes: ["024", "025", "053", "054", "055", "059"],
  },
  {
    id: "telecel",
    label: "Telecel",
    wallet: "Telecel Cash",
    logo: require("@/assets/images/networks/telecel.png"),
    prefixes: ["020", "050"],
  },
  {
    id: "at",
    label: "AT",
    wallet: "AT Money",
    logo: require("@/assets/images/networks/at.png"),
    prefixes: ["026", "027", "056", "057"],
  },
];

export function getNetwork(id: NetworkId): Network {
  return NETWORKS.find((n) => n.id === id) ?? NETWORKS[0];
}

export function networkLabel(id: NetworkId): string {
  return getNetwork(id).label;
}

export function networkLogo(id: NetworkId): ImageSourcePropType {
  return getNetwork(id).logo;
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
