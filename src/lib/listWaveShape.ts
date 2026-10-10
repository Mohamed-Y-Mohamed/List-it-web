// lib/listWaveShape.ts
// The geometry behind the list card's layered wave, ported from the iOS
// ListRowView. The component that draws it is components/ui/ListWave.
//
// The iOS shape, for reference:
//
//   x = min(depth, width)
//   move  (0, 0) -> line (x, 0)
//   curve to (x, height) with controls (x + curvature, 0.30h) and (x - curvature, 0.70h)
//   line  (0, height) -> close
//
// ---------------------------------------------------------------------------
// Why the curvature is a share of the width and not 25 pixels
//
// SwiftUI takes `depth` as a fraction of the card's width (0.38, 0.31, 0.23) but
// `curvature` as an absolute 25/23/20 points. That is unambiguous on iOS, where
// the only card using it is a full-width row about 358pt across.
//
// Here the same card is also a grid tile at roughly half that. Keeping curvature
// absolute would hold the bulge at 25px while the band it bends shrank from 136px
// to 65px, taking the curvature-to-depth ratio from 0.18 to 0.38 — the gentle lean
// of the original would come out as a pronounced S on the smaller card. Expressed
// as a share of the width instead, the ratio holds at every size: 6.94% of 358 is
// 24.8px, which is the iOS value to within a rounding error, and a grid tile gets
// the same shape scaled down rather than a different one.
//
// That also means no measurement anywhere. Every coordinate is a percentage, so a
// viewBox of `0 0 100 100` with preserveAspectRatio="none" lets the browser do the
// scaling — no ResizeObserver, no width threaded through props.
//
// Plain module rather than part of the component on purpose: it is arithmetic, and
// arithmetic is worth testing. ts-jest compiles against the project tsconfig,
// where `jsx` is "preserve", so a test cannot import a .tsx file at all — the same
// reason overlayStack, panelSwipe and taskView are all plain modules with their
// drawing elsewhere.

export interface Wave {
  /** Where the band's right edge sits, as a percentage of the card's width. */
  depth: number;
  /** How far the edge bows out and back, also a percentage of the width. */
  curvature: number;
  /** Fill strength in dark and in light. */
  dark: number;
  light: number;
}

/**
 * The three bands, outermost first so each later one paints over it.
 *
 * Depths are the iOS fractions unchanged. Curvatures are the iOS points divided by
 * the 358pt row they were drawn against: 25/358, 23/358, 20/358.
 */
export const WAVES: readonly Wave[] = [
  { depth: 38, curvature: 6.94, dark: 0.16, light: 0.14 },
  { depth: 31, curvature: 6.39, dark: 0.25, light: 0.22 },
  { depth: 23, curvature: 5.56, dark: 0.45, light: 0.38 },
] as const;

/** One band as an SVG path, in the 0-100 coordinate space described above. */
export function wavePath({ depth, curvature }: Wave): string {
  // `min(depth, rect.width)` in the original: a band cannot be wider than the
  // card it sits in, and in viewBox terms the card is 100 wide.
  const x = Math.min(depth, 100);

  return [
    "M 0 0",
    `L ${x} 0`,
    `C ${x + curvature} 30, ${x - curvature} 70, ${x} 100`,
    "L 0 100",
    "Z",
  ].join(" ");
}
