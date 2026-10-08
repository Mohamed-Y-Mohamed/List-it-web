// lib/surfaceTheme.ts
// Which background the app paints, and the surfaces that have to move with it.
//
// The field used to be one value per theme, written into `ui/tokens` as a hex and
// retyped as `bg-[#131A2B]` in twenty-odd places. Letting someone choose the
// background means none of those can stay literal, and it means a background is
// not a single colour: a card has to be visible against whichever field is behind
// it. Pure black with the old navy card reads as a rendering fault, and a white
// card on a white field disappears entirely unless its border carries the edge.
//
// So each option is a ramp, not a colour. Six values, set as CSS custom properties
// on the document element, and everything downstream reads those.
//
//   field      the page behind everything
//   deep       a step below the field, for bands and the launch screen
//   raised     a surface sitting on the field that is not a card
//   card       a card
//   selected   a card that is active or selected
//   border     the hairline that separates a card from its field
//
// Options are paired across themes rather than listed per theme, so "the warm one"
// stays the warm one when the user switches to light. Only the current theme's
// three are ever offered, because a dark background has nothing to say about how
// the app should look in daylight.

export type SurfaceChoice = "mono" | "cool" | "warm";
export type SurfaceTheme = "light" | "dark";

export interface SurfaceRamp {
  field: string;
  deep: string;
  raised: string;
  card: string;
  selected: string;
  border: string;
}

/**
 * `mono` is the default in both themes.
 *
 * Its light half is the one combination here where the card and the field are the
 * same colour, so the border does all the work of separating them. That is not an
 * oversight — it is what the app already shipped in light mode and what the
 * screenshots show reading correctly — but it is why `border` is a published part
 * of the ramp rather than a constant, and why mono light carries the strongest one.
 */
export const SURFACE_RAMPS: Record<
  SurfaceTheme,
  Record<SurfaceChoice, SurfaceRamp>
> = {
  dark: {
    // True black. Cheap on an OLED panel, and the card is lifted far enough off it
    // to still read as a card — #0E1013 against #000000 is not enough of a step at
    // low brightness, which is why this is #121212 rather than a near-black.
    mono: {
      field: "#000000",
      deep: "#000000",
      raised: "#1C1C1E",
      card: "#121212",
      selected: "#26262A",
      border: "rgba(255,255,255,0.10)",
    },
    // The palette the app shipped with, kept intact so choosing it is a true
    // return rather than an approximation of what used to be here.
    cool: {
      field: "#0B1222",
      deep: "#05080F",
      raised: "#121829",
      card: "#131A2B",
      selected: "#1B2440",
      border: "rgba(255,255,255,0.08)",
    },
    // Warm neutral charcoal: no blue in it, low chroma, so it reads matte rather
    // than as a glossy black.
    warm: {
      field: "#16181D",
      deep: "#0E1013",
      raised: "#22262D",
      card: "#1E2127",
      selected: "#2B3038",
      border: "rgba(255,255,255,0.07)",
    },
  },
  light: {
    mono: {
      field: "#FFFFFF",
      deep: "#F4F4F5",
      raised: "#F4F4F5",
      card: "#FFFFFF",
      selected: "#EEEEF0",
      border: "rgba(15,23,42,0.12)",
    },
    cool: {
      field: "#F6F8FC",
      deep: "#EEF2F8",
      raised: "#EEF2F8",
      card: "#FFFFFF",
      selected: "#E6EDF7",
      border: "rgba(15,23,42,0.09)",
    },
    warm: {
      field: "#F4F3F0",
      deep: "#EDEBE6",
      raised: "#EDEBE6",
      card: "#FFFFFF",
      selected: "#E8E5DE",
      border: "rgba(28,25,23,0.10)",
    },
  },
};

/** What each option is called, per theme. The same ramp, named for what you see. */
export const SURFACE_LABELS: Record<
  SurfaceTheme,
  Record<SurfaceChoice, { label: string; hint: string }>
> = {
  dark: {
    mono: { label: "Black", hint: "True black, easiest on an OLED screen" },
    cool: { label: "Navy", hint: "The deep blue the app has always used" },
    warm: { label: "Charcoal", hint: "A soft, matte near-black" },
  },
  light: {
    mono: { label: "White", hint: "Plain white, the most contrast" },
    cool: { label: "Cool grey", hint: "A faint blue cast, pairs with Navy" },
    warm: { label: "Warm paper", hint: "A soft off-white, pairs with Charcoal" },
  },
};

export const DEFAULT_SURFACE: SurfaceChoice = "mono";

/** The order the options are offered in, mirroring how far each is from plain. */
export const SURFACE_ORDER: SurfaceChoice[] = ["mono", "cool", "warm"];

const STORAGE_KEY_PREFIX = "listit.surface.";

const storageKey = (theme: SurfaceTheme) => `${STORAGE_KEY_PREFIX}${theme}`;

/**
 * Narrows an unknown stored value, falling back to the default.
 *
 * Same reasoning as the list layout: the value comes out of localStorage, which is
 * shared with every other key on the origin and survives app updates, so a stale
 * or hand-edited one has to land on a ramp that exists rather than be trusted into
 * `undefined.field`.
 */
export function parseSurfaceChoice(value: unknown): SurfaceChoice {
  return value === "mono" || value === "cool" || value === "warm"
    ? value
    : DEFAULT_SURFACE;
}

/** The stored choice for a theme, or the default when nothing is stored. */
export function readSurfaceChoice(theme: SurfaceTheme): SurfaceChoice {
  if (typeof window === "undefined") return DEFAULT_SURFACE;

  try {
    return parseSurfaceChoice(window.localStorage.getItem(storageKey(theme)));
  } catch {
    return DEFAULT_SURFACE;
  }
}

/** Records the choice for a theme. Silent on failure, as reads are. */
export function writeSurfaceChoice(
  theme: SurfaceTheme,
  choice: SurfaceChoice,
): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey(theme), choice);
  } catch {
    // The choice then lasts the session, which beats the setting refusing to move.
  }
}

export function surfaceRamp(
  theme: SurfaceTheme,
  choice: SurfaceChoice,
): SurfaceRamp {
  return SURFACE_RAMPS[theme][choice];
}

/**
 * Writes a ramp onto the document element.
 *
 * On `documentElement` rather than a wrapper so the values are in scope for
 * portalled overlays too — dialogs and sheets render into `document.body`, outside
 * whatever tree set them, and a card inside a sheet has to match the one behind it.
 */
export function applySurfaceRamp(ramp: SurfaceRamp): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement.style;
  root.setProperty("--surface-field", ramp.field);
  root.setProperty("--surface-deep", ramp.deep);
  root.setProperty("--surface-raised", ramp.raised);
  root.setProperty("--surface-card", ramp.card);
  root.setProperty("--surface-selected", ramp.selected);
  root.setProperty("--surface-border", ramp.border);
}
