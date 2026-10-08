import {
  DEFAULT_SURFACE,
  parseSurfaceChoice,
  readSurfaceChoice,
  SURFACE_LABELS,
  SURFACE_ORDER,
  SURFACE_RAMPS,
  surfaceRamp,
  writeSurfaceChoice,
  type SurfaceTheme,
} from "../surfaceTheme";

const THEMES: SurfaceTheme[] = ["light", "dark"];

/** #RRGGBB -> relative luminance, per WCAG. */
function luminance(hex: string): number {
  const channel = (pair: string) => {
    const value = parseInt(pair, 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  const r = channel(hex.slice(1, 3));
  const g = channel(hex.slice(3, 5));
  const b = channel(hex.slice(5, 7));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("surfaceTheme", () => {
  beforeEach(() => localStorage.clear());

  describe("the ramps", () => {
    it("defines every option for both themes", () => {
      for (const theme of THEMES) {
        for (const choice of SURFACE_ORDER) {
          expect(surfaceRamp(theme, choice)).toBeDefined();
          expect(SURFACE_LABELS[theme][choice].label).toBeTruthy();
        }
      }
    });

    // The whole risk of a user-chosen background: a card that vanishes into the
    // field behind it. Every ramp has to separate them by tone or by a border that
    // is actually visible — never neither.
    it("keeps a card distinguishable from its field in every option", () => {
      for (const theme of THEMES) {
        for (const choice of SURFACE_ORDER) {
          const ramp = surfaceRamp(theme, choice);
          const separatedByTone =
            Math.abs(luminance(ramp.card) - luminance(ramp.field)) > 0.004;

          const alpha = Number(
            ramp.border.match(/,\s*([\d.]+)\s*\)$/)?.[1] ?? "0",
          );
          const separatedByBorder = alpha >= 0.07;

          expect(separatedByTone || separatedByBorder).toBe(true);
        }
      }
    });

    // Mono light is the one ramp where card and field are the same colour, so its
    // border is the only thing drawing the card. It has to be the strongest.
    it("gives the strongest border to the ramp with no tonal separation", () => {
      const mono = SURFACE_RAMPS.light.mono;
      expect(mono.card).toBe(mono.field);
      expect(Number(mono.border.match(/,\s*([\d.]+)\s*\)$/)![1])).toBeGreaterThan(
        Number(SURFACE_RAMPS.light.cool.border.match(/,\s*([\d.]+)\s*\)$/)![1]),
      );
    });
  });

  describe("storage", () => {
    it("falls back to the default for anything unrecognised", () => {
      expect(parseSurfaceChoice(null)).toBe(DEFAULT_SURFACE);
      expect(parseSurfaceChoice("navy")).toBe(DEFAULT_SURFACE);
      expect(parseSurfaceChoice(7)).toBe(DEFAULT_SURFACE);
      expect(parseSurfaceChoice("warm")).toBe("warm");
    });

    // The point of storing per theme: picking a dark ground must not decide what
    // light mode looks like.
    it("keeps each theme's choice independent", () => {
      writeSurfaceChoice("dark", "warm");
      writeSurfaceChoice("light", "cool");

      expect(readSurfaceChoice("dark")).toBe("warm");
      expect(readSurfaceChoice("light")).toBe("cool");
    });

    it("reads the default for a theme that has never been chosen for", () => {
      writeSurfaceChoice("dark", "cool");
      expect(readSurfaceChoice("light")).toBe(DEFAULT_SURFACE);
    });
  });
});
