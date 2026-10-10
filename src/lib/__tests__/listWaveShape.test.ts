import { WAVES, wavePath, type Wave } from "../listWaveShape";

/**
 * The iOS ListRowView values, for the record.
 *
 * SwiftUI takes depth as a fraction of the card's width and curvature as absolute
 * points, against a row about 358pt across. The port expresses both as a share of
 * the width so the shape survives being scaled down to a grid tile — these are
 * what that has to come back to.
 */
const IOS = {
  rowWidth: 358,
  depths: [0.38, 0.31, 0.23],
  curvatures: [25, 23, 20],
} as const;

describe("the wave tables", () => {
  it("keeps the three iOS depths", () => {
    expect(WAVES.map((wave) => wave.depth / 100)).toEqual(IOS.depths);
  });

  // The reason curvature is a percentage at all. At the width iOS drew these
  // against, the ported value has to resolve to the original points, or the
  // full-width row is not the shape that was designed.
  it("resolves to the iOS curvature at the width iOS used", () => {
    WAVES.forEach((wave, index) => {
      const pixels = (wave.curvature / 100) * IOS.rowWidth;
      expect(pixels).toBeCloseTo(IOS.curvatures[index], 0);
    });
  });

  // The point of the percentage approach: a half-width card gets the same shape,
  // not a more extreme one. Had curvature stayed absolute, this ratio would have
  // roughly doubled on the grid tile.
  it("holds the curvature-to-depth ratio at any card width", () => {
    for (const width of [358, 170, 92]) {
      WAVES.forEach((wave) => {
        const ratio =
          ((wave.curvature / 100) * width) / ((wave.depth / 100) * width);

        // toBeCloseTo, not toEqual: scaling both terms by the width and dividing
        // disagrees with the direct division in the last bit of a double. The
        // claim is that the ratio does not depend on the width, not that IEEE 754
        // is associative.
        expect(ratio).toBeCloseTo(wave.curvature / wave.depth, 12);
      });
    }
  });

  it("paints each band stronger and shallower than the one behind it", () => {
    for (let i = 1; i < WAVES.length; i += 1) {
      expect(WAVES[i].depth).toBeLessThan(WAVES[i - 1].depth);
      expect(WAVES[i].dark).toBeGreaterThan(WAVES[i - 1].dark);
      expect(WAVES[i].light).toBeGreaterThan(WAVES[i - 1].light);
    }
  });

  // Dark mode carries every band slightly stronger, because the same fill over a
  // near-black field reads weaker than over a white one.
  it("runs every band stronger in dark than in light", () => {
    for (const wave of WAVES) {
      expect(wave.dark).toBeGreaterThan(wave.light);
    }
  });

  // Every fill is a tint, never a solid. A band at full strength would bury the
  // card's own surface and the name sitting on it.
  it("keeps every band a tint", () => {
    for (const wave of WAVES) {
      expect(wave.dark).toBeGreaterThan(0);
      expect(wave.dark).toBeLessThan(1);
      expect(wave.light).toBeGreaterThan(0);
      expect(wave.light).toBeLessThan(1);
    }
  });
});

describe("wavePath", () => {
  const path = (wave: Partial<Wave>) =>
    wavePath({ depth: 38, curvature: 6.94, dark: 0.16, light: 0.14, ...wave });

  // Closed, or the fill leaks into the rest of the viewBox.
  it("returns a closed path starting at the origin", () => {
    const d = path({});

    expect(d.startsWith("M 0 0")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
  });

  // The S: out at 30% of the height, back in at 70%, which is what
  // `rect.height * 0.30` and `* 0.70` are in the Swift shape.
  it("bows out and back around the band edge", () => {
    expect(path({ depth: 40, curvature: 5 })).toBe(
      "M 0 0 L 40 0 C 45 30, 35 70, 40 100 L 0 100 Z",
    );
  });

  // `min(depth, rect.width)` in the original. A band cannot be wider than the
  // card, and in viewBox terms the card is 100 wide.
  it("clamps a band to the width of the card", () => {
    expect(path({ depth: 140, curvature: 0 })).toBe(
      "M 0 0 L 100 0 C 100 30, 100 70, 100 100 L 0 100 Z",
    );
  });

  it("produces a path for every band", () => {
    for (const wave of WAVES) {
      expect(wavePath(wave)).toMatch(/^M 0 0 L [\d.]+ 0 C .+ Z$/);
    }
  });
});
