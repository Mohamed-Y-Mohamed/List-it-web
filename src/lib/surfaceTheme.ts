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
// `soft` is the default in both themes: Midnight in dark, Grey in light.

export type PresetChoice = "mono" | "soft" | "cool" | "warm";
/** A preset, or `custom`: a colour the user picked, with the ramp derived from it. */
export type SurfaceChoice = PresetChoice | "custom";
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
 * `soft` is the default in both themes (Midnight / Grey).
 *
 * `mono` light used to be the one combination here with no tonal separation at
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
  Record<PresetChoice, SurfaceRamp>
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
    // Grey: a soft #E8E8E8 page with pure white cards, so every box stands out.
    // The light partner of Midnight and the light default.
    soft: {
      field: "#E8E8E8",
      deep: "#DCDCDC",
      raised: "#F4F4F5",
      card: "#FFFFFF",
      selected: "#F0F0F2",
      border: "rgba(15,23,42,0.10)",
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
  Record<PresetChoice, { label: string; hint: string }>
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
    soft: { label: "Grey", hint: "Soft grey with white cards, pairs with Midnight" },
    cool: { label: "Ice blue", hint: "A cool blue cast, pairs with Navy" },
    warm: {
      label: "Warm paper",
      hint: "A soft off-white, pairs with Midnight Velvet",
    },
  },
};

export const DEFAULT_SURFACE: PresetChoice = "soft";

/** The order the options are offered in: the default first. */
export const SURFACE_ORDER: PresetChoice[] = ["soft", "mono", "cool", "warm"];

// ---------------------------------------------------------------------------
// Storage: cookies, so the choice survives reloads and is readable by the tiny
// inline script in the root layout before the first paint.

const ONE_YEAR = 60 * 60 * 24 * 365;

export const THEME_COOKIE = "listit_theme";
/**
 * One choice for both themes. Each key is a pair — Grey/Midnight, White/Black,
 * Ice blue/Navy, Warm paper/Midnight Velvet, or a custom colour and its partner —
 * so switching to dark mode shows the dark version of what was picked.
 */
export const SURFACE_COOKIE = "listit_surface";
/** Per-theme cookies from before the choice was shared; still read as a fallback. */
export const legacySurfaceCookie = (theme: SurfaceTheme) => `listit_surface_${theme}`;

/** Reads a cookie by name, or null. */
export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie
      .split("; ")
      .find((part) => part.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
  } catch {
    return null;
  }
}

/** Writes a site-wide cookie that lasts a year. */
export function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; SameSite=Lax`;
  } catch {
    // Cookies blocked: the choice then lasts this page only.
  }
}

/** Narrows an unknown stored value, falling back to the default. */
export function parseSurfaceChoice(value: unknown): SurfaceChoice {
  return value === "mono" ||
    value === "soft" ||
    value === "cool" ||
    value === "warm" ||
    value === "custom"
    ? value
    : DEFAULT_SURFACE;
}

/** The saved theme, or null when the visitor has never chosen one. */
export function readThemeChoice(): SurfaceTheme | null {
  const value = readCookie(THEME_COOKIE);
  return value === "dark" || value === "light" ? value : null;
}

export function writeThemeChoice(theme: SurfaceTheme): void {
  writeCookie(THEME_COOKIE, theme);
}

/** The stored background for a theme, or the default when nothing is stored. */
export function readSurfaceChoice(theme: SurfaceTheme): SurfaceChoice {
  return parseSurfaceChoice(
    readCookie(SURFACE_COOKIE) ?? readCookie(legacySurfaceCookie(theme)),
  );
}

/** Records the background. It applies to both themes (see SURFACE_COOKIE). */
export function writeSurfaceChoice(
  _theme: SurfaceTheme,
  choice: SurfaceChoice,
): void {
  writeCookie(SURFACE_COOKIE, choice);
}

// ---------------------------------------------------------------------------
// Custom colour. The ramp is derived from one hex and saved whole in a cookie
// (`|`-separated, field first), so the inline script in the root layout can
// paint it before the first frame without repeating this maths.

export const customCookie = (theme: SurfaceTheme) => `listit_custom_${theme}`;

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

function mix(hex: string, target: number, amount: number): string {
  const channel = (i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) =>
    Math.round(channel(i) + (target - channel(i)) * amount)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${out.join("")}`.toUpperCase();
}

/** Relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const lin = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(0) + 0.7152 * lin(1) + 0.0722 * lin(2);
}

/**
 * A full ramp from one colour. Light mode keeps white cards on the colour (the
 * same idea as Grey); dark mode lifts the cards a step towards white.
 */
export function customRamp(theme: SurfaceTheme, hex: string): SurfaceRamp {
  const field = hex.toUpperCase();
  if (theme === "light") {
    const nearWhite = luminance(field) > 0.85;
    return {
      field,
      deep: mix(field, 0, 0.06),
      raised: mix(field, 255, 0.55),
      card: nearWhite ? "#F4F4F5" : "#FFFFFF",
      selected: mix(field, 255, 0.4),
      border: "rgba(15,23,42,0.10)",
    };
  }
  return {
    field,
    deep: mix(field, 0, 0.3),
    raised: mix(field, 255, 0.14),
    card: mix(field, 255, 0.08),
    selected: mix(field, 255, 0.18),
    border: "rgba(255,255,255,0.09)",
  };
}

const RAMP_KEYS: (keyof SurfaceRamp)[] = [
  "field",
  "deep",
  "raised",
  "card",
  "selected",
  "border",
];

/** The saved custom colour for a theme, or null. */
export function readCustomColor(theme: SurfaceTheme): string | null {
  const field = readCookie(customCookie(theme))?.split("|")[0];
  return isHexColor(field) ? field : null;
}

/**
 * The same colour for the other theme: a deep shade of it for dark mode, a pale
 * tint of it for light mode. A colour that already suits the theme is kept.
 */
export function partnerColor(hex: string, theme: SurfaceTheme): string {
  const lum = luminance(hex);
  if (theme === "dark") return lum < 0.05 ? hex.toUpperCase() : mix(hex, 0, 0.82);
  return lum > 0.6 ? hex.toUpperCase() : mix(hex, 255, 0.82);
}

/**
 * Saves a custom colour picked while in `theme`, plus its partner for the other
 * theme, so dark mode shows the dark version of it and light mode the light one.
 */
export function writeCustomColor(theme: SurfaceTheme, hex: string): void {
  const other: SurfaceTheme = theme === "dark" ? "light" : "dark";
  const save = (t: SurfaceTheme, colour: string) => {
    const ramp = customRamp(t, colour);
    writeCookie(customCookie(t), RAMP_KEYS.map((key) => ramp[key]).join("|"));
  };
  save(theme, hex);
  save(other, partnerColor(hex, other));
}

export function surfaceRamp(
  theme: SurfaceTheme,
  choice: SurfaceChoice,
): SurfaceRamp {
  if (choice === "custom") {
    const hex = readCustomColor(theme);
    return hex ? customRamp(theme, hex) : SURFACE_RAMPS[theme][DEFAULT_SURFACE];
  }
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
