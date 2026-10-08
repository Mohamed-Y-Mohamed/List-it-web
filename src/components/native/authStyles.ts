// The phone layout for sign-in, sign-up and forgot-password.
//
// ---------------------------------------------------------------------------
// Why these screens needed their own set
//
// All three are one shared component per route, built for a desktop browser: a
// `max-w-6xl` two-column glass card on a five-stop blue gradient, with two
// infinitely animating blur blobs behind it and a marketing panel in the right
// half that a phone never sees. On a phone the second column collapses away and
// what is left is a 700px-wide layout squeezed into 360px.
//
// It also looked like a different product. The app's launch sequence — launcher
// icon, splash, first-run intro — is orange on a flat #ffffff / #111827 field. The
// sign-in screen sat between the intro and the app, in blue, on a gradient. That
// seam is the "two different designs" complaint.
//
// So the native values here do two things: fit a phone, and put the door to the app
// in the same visual language as the rooms either side of it.
//
//   field        var(--splash-bg), the exact surface the splash and the app paint,
//                so splash -> sign-in is one continuous screen rather than a cut
//   accent       orange-500, matching the intro's primary button
//   radii/type   rounded-[14px] and text-[16px], the scale used by NativeOnboarding,
//                NativeListCard and NativeBackBar
//   motion       the existing framer entrances are kept; presses use
//                active:scale-[0.98], exactly as NativeOnboarding's button does
//
// ---------------------------------------------------------------------------
// Presentation only
//
// Nothing here changes behaviour. Every field, handler, validation rule, redirect
// and route on those three screens is untouched — they work, and they are shared
// with the website. This module is a set of class strings and nothing else.
//
// Native only: the whole file is dropped from the web bundle, because every use of
// it sits behind an IS_NATIVE_BUILD branch whose other arm is the original string.

/** The page container. Fills the window; the screens inset their own content. */
export const AUTH_FIELD = "bg-[var(--splash-bg)]";

/**
 * The card. On the web this is a bordered, shadowed, blurred glass panel that has
 * to separate itself from the gradient behind it. Here the field is already the
 * app's own surface, so a card drawn on top of it would be a box for no reason.
 */
export const AUTH_CARD = "w-full max-w-[26rem] mx-auto flex flex-col";

/** The form column. The web version is half the card and heavily padded. */
export const AUTH_PANEL = "w-full px-6 py-2";

/**
 * A text input. 50px tall to match the intro's buttons and clear the 44px minimum,
 * and 16px text because anything smaller makes an Android WebView zoom on focus.
 */
export const AUTH_INPUT =
  "w-full min-h-[50px] rounded-[14px] border pl-11 pr-3 text-[16px] font-medium transition-colors duration-200 focus:outline-none";

export const AUTH_INPUT_DARK =
  "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500";

export const AUTH_INPUT_LIGHT =
  "bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-orange-500";

/** The primary action. Same shape, colour and press feedback as the intro's. */
export const AUTH_PRIMARY_BUTTON =
  "mt-6 flex min-h-[50px] w-full items-center justify-center rounded-[14px] bg-orange-500 text-[16px] font-semibold text-white transition-transform duration-100 active:scale-[0.98] active:bg-orange-600 disabled:opacity-60";

/** A secondary route out of the screen: forgot password, sign up, back to login. */
export const AUTH_LINK = "text-[15px] font-medium text-orange-500";

/**
 * Bottom padding for the scrolling column, so the last control clears the
 * navigation bar and the keyboard.
 *
 * These screens run `native-immersive`, which switches off the body's own
 * bottom inset (globals.css) so their background can reach the screen edge — which
 * means they are responsible for insetting their own content.
 */
export const AUTH_SCROLL_PADDING =
  "calc(var(--safe-bottom) + var(--keyboard-offset, 0px) + 1.5rem)";
