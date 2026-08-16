/**
 * Burger Yard brand tokens, taken from the "01 - Design System" board in Figma.
 * https://www.figma.com/design/NHgpLwZNZIXF0wQJcf9QRI/Burger-Yard
 */

export const Brand = {
  /** Primary red - palette head "Primary" */
  red: "#D62828",
  /** Gold - palette head "Gold", used by the splash circle */
  gold: "#F4C542",
  /** Orange - palette head "Orange" */
  orange: "#F77F00",
  /** Ink - darkest neutral, used by the splash circle */
  ink: "#121212",
  /** Deep maroon splash backdrop (Frames 2-4 of the new auth intro) */
  maroon: "#800000",
  white: "#FFFFFF",
  /** Neutral text greys */
  grey: "#6B6B6B",
  surface: "#F8F9FA",
  field: "#F5F5F5",
  border: "#E5E7EB",
  divider: "#F3F4F6",
} as const;

/** Splash choreography - every transition is 1s or less. */
export const SplashTiming = {
  /** Frame 1: the black and red circles travel toward each other. */
  collide: 750,
  /** Frame 1 -> 2: impact, colour wipes to maroon, circles merge into gold. */
  merge: 420,
  /** Frame 2 -> 3: the small gold circle grows to 150px. */
  grow: 650,
  /** Frame 3 -> 4: the gold circle becomes the Burger Yard logo. */
  reveal: 620,
  /** Beat before the welcome screen takes over. */
  hold: 700,
} as const;

/**
 * Plain-object edge-to-edge fill, for spreading into a StyleSheet entry.
 *
 * React Native has no name for this that survives an SDK change: 0.81 types
 * `StyleSheet.absoluteFill` as an opaque registered style and exposes the
 * object as `absoluteFillObject`, while 0.86 drops `absoluteFillObject`
 * entirely. Spelling it out works on both.
 */
export const FillParent = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

/** Circle geometry, in Figma units on a 390x844 frame. */
export const SplashGeometry = {
  dot: 50,
  logo: 150,
  /** Resting offsets of the two dots from the centre of the frame. */
  blackOffset: -47,
  redOffset: 46,
} as const;
