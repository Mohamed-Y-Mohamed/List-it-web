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
// Options are keyed across themes rather than listed per theme, so each key holds a
// dark half and a light half and the file stays one table instead of two. Only the
// current theme's four are ever offered, because a dark background has nothing to say
// about how the app should look in daylight — and the choice is stored per theme, so
// the pairing inside a key is organisational, not something the user ever feels.
//
// `soft` is the fourth, added after the first three shipped. It is the only key whose
// two halves are not obviously the same idea — Midnight is a lifted black, Cream a
// warmed white — which is what the name is doing: the softened version of `mono`,
// in whichever direction the theme runs.

export type SurfaceChoice = "mono" | "soft" | "cool" | "warm";
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
 * Its light half used to be the one combination here with no tonal separation at
 * all: a white card on a white field, with the border doing all the work. On a
 * screen of cards that read as one flat sheet with hairlines ruled across it, so
 * the card is a light grey now and the field keeps the white.
 *
 * `raised` and `deep` moved down a step with it, because they were the #F4F4F5 the
 * card has taken — and a raised surface the same colour as the cards sitting on it
 * is not raised. Every ramp in both themes now separates card from field by tone,
 * which is what `surfaceTheme.test.ts` holds them to.
 *
 * mono light keeps the strongest border of the four regardless. Grey on white is
 * a quiet step, and the hairline is what keeps the edge crisp where two cards sit
 * side by side in the grid.
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
    // A lifted neutral black. The faint +4 of blue in the field is the only chroma
    // in it, which is what keeps it from reading as the same colour as Velvet at a
    // different brightness.
    //
    // Its steps are +10 per channel rather than the +6 that looked right on paper:
    // #242428 as the card measured 0.0031 luminance off this field, under the 0.004
    // the suite holds every ramp to, and a card you cannot find is the one failure
    // mode a chosen background actually has. #2A2A2F measures 0.0058, which is where
    // Velvet already sits.
    soft: {
      field: "#202024",
      deep: "#16161A",
      raised: "#35353B",
      card: "#2A2A2F",
      selected: "#3C3C43",
      border: "rgba(255,255,255,0.09)",
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
    // Deep plum. The one ground in either theme that is a colour rather than a
    // temperature, and it replaced a warm neutral charcoal (#16181D).
    //
    // Every step holds the field's hue instead of drifting toward neutral grey,
    // which is the whole difficulty with a saturated dark ground: a #2A2A2F-ish
    // card on this field does not read as "lifted", it reads as dirty. So the
    // steps carry the plum up with them — roughly +10 red, +7 green, +14 blue
    // per level, which keeps the ratio between channels near the field's own.
    warm: {
      field: "#240B36",
      deep: "#190726",
      raised: "#381852",
      card: "#2E1244",
      selected: "#421E60",
      border: "rgba(255,255,255,0.08)",
    },
  },
  light: {
    // A grey card on a white field, not white on white. See the note above.
    mono: {
      field: "#FFFFFF",
      deep: "#EBEBED",
      raised: "#EBEBED",
      card: "#F4F4F5",
      selected: "#EEEEF0",
      border: "rgba(15,23,42,0.12)",
    },
    // Parchment. The one light field with enough chroma to be a colour rather than a
    // temperature, so the card stays pure white and the hairline is tinted a warm
    // olive — a slate border on this field reads as a grey line drawn on yellow.
    //
    // `deep` drops a long way for the same reason the field is bold: a 2% step on a
    // saturated field is invisible, where on white it is plenty.
    soft: {
      field: "#FDFBD4",
      deep: "#EFEAAF",
      raised: "#F8F4C4",
      card: "#FFFFFF",
      selected: "#F6F1C2",
      border: "rgba(60,54,16,0.11)",
    },
    // Ice blue, which replaced a near-white cool grey (#F6F8FC). The grey was a
    // temperature rather than a choice — next to White in a four-up row it read as
    // the same swatch twice, and the option it was meant to be the daylight half of
    // is Navy.
    cool: {
      field: "#EDF4FF",
      deep: "#DAE6FA",
      raised: "#E2ECFD",
      card: "#FFFFFF",
      selected: "#D7E5FC",
      border: "rgba(15,23,42,0.10)",
    },
    warm: {
      field: "#e9e7e1",
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
    soft: {
      label: "Midnight",
      hint: "A lifted near-black, softer than true black",
    },
    cool: { label: "Navy", hint: "The deep blue the app has always used" },
    warm: {
      label: "Midnight Velvet",
      hint: "A deep plum, the one ground with real colour in it",
    },
  },
  light: {
    mono: { label: "White", hint: "Plain white, the most contrast" },
    soft: { label: "Cream", hint: "A warm parchment, pairs with Midnight" },
    cool: { label: "Ice blue", hint: "A cool blue cast, pairs with Navy" },
    warm: {
      label: "Warm paper",
      hint: "A soft off-white, pairs with Midnight Velvet",
    },
  },
};

export const DEFAULT_SURFACE: SurfaceChoice = "mono";

/**
 * The order the options are offered in.
 *
 * Set deliberately rather than derived: it used to mirror how far each option was
 * from plain, which stopped being a rule the moment there were four and the dark set
 * was asked for as Black, Midnight, Navy, Midnight Velvet. By luminance that order
 * is 0, 0.0147, 0.0062, 0.0088 — not a ramp, and it does not need to be one. The light
 * set follows the same slots: White, Cream, Ice blue, Warm paper.
 */
export const SURFACE_ORDER: SurfaceChoice[] = ["mono", "soft", "cool", "warm"];

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
  return value === "mono" ||
    value === "soft" ||
    value === "cool" ||
    value === "warm"
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
