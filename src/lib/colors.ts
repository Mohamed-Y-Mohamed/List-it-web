// lib/colors.ts
// The one place that decides whether a stored colour is usable, and what to use
// instead when it is not.
//
// Colours reach the app as `bg_color_hex` strings on the list, collection and note
// rows, and are always applied as inline styles rather than as class names. What
// was missing was any agreement about two things:
//
//   * what counts as a valid value. Nothing validated the shape, so a `#fff`, an
//     `#RRGGBBAA` or a stray space travelled all the way to the DOM.
//   * what to use when there isn't one. Five call sites had invented five
//     different fallbacks — #007AFF, #fb923c, #000000, #ccc and #ffffff — so the
//     "default colour" depended on which screen you were looking at, and one of
//     them painted a white title onto a white background.
//
// Shared by both builds deliberately: this is correctness, not presentation.

/**
 * The colour to use when nothing usable is stored and the caller has no better
 * idea. iOS system blue, matching the first list card and the Today view.
 */
export const DEFAULT_COLOR_HEX = "#007AFF";

const SIX_DIGIT_HEX = /^#[0-9a-f]{6}$/i;
const THREE_DIGIT_HEX = /^#[0-9a-f]{3}$/i;
const EIGHT_DIGIT_HEX = /^#[0-9a-f]{8}$/i;

/**
 * Normalise a stored colour to an exact `#RRGGBB`, or null if it cannot be.
 *
 * The exactness matters more than it looks. `noteCard` builds its gradient by
 * appending `dd`, `aa` and `bb` to this value, and appending to anything that is
 * not a 6-digit hex produces a token the browser cannot parse. CSS then discards
 * **the entire declaration**, not just the bad stop — which is how a note ended up
 * with no background at all rather than a slightly wrong one, silently and with
 * nothing in the console.
 */
export function normaliseHex(value: string | null | undefined): string | null {
  if (!value) return null;

  const hex = value.trim();
  if (SIX_DIGIT_HEX.test(hex)) return hex;

  // #abc -> #aabbcc
  if (THREE_DIGIT_HEX.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  // #rrggbbaa -> #rrggbb. The alpha is dropped rather than carried through:
  // every consumer applies its own opacity on top, and two sources of
  // transparency multiply into something nobody chose.
  if (EIGHT_DIGIT_HEX.test(hex)) return hex.slice(0, 7);

  return null;
}

/** True when a stored value can safely be used as a colour. */
export function isUsableHex(value: string | null | undefined): boolean {
  return normaliseHex(value) !== null;
}

/**
 * A usable `#RRGGBB`, falling back when the stored value is not one.
 *
 * `fallback` is a parameter rather than always `DEFAULT_COLOR_HEX` because a few
 * screens have a deliberate house colour for "no colour set" that predates this
 * helper and is correct for them. Passing it explicitly keeps those appearances
 * intact while still routing every one of them through the same validation.
 */
export function resolveColor(
  value: string | null | undefined,
  fallback: string = DEFAULT_COLOR_HEX
): string {
  return normaliseHex(value) ?? fallback;
}

/**
 * Whether text on this background should be dark.
 *
 * Replaces a hand-maintained list of "light" hex values that could never match:
 * the list was written uppercase but compared against a `.toLowerCase()`d input,
 * so every lookup missed and the decision fell through to a luminance sum that
 * returned NaN for a malformed value — landing on white text over a light card.
 *
 * Uses the standard perceptual weighting rather than a plain channel sum, so
 * yellows and cyans are correctly treated as light.
 */
export function isLightColor(value: string | null | undefined): boolean {
  const hex = normaliseHex(value);
  if (!hex) return false;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // ITU-R BT.601 luma. 0.6 of full brightness is the point where dark text
  // becomes the more legible choice.
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
