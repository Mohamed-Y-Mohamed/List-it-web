import {
  DEFAULT_SURFACE,
  parseSurfaceChoice,
  readSurfaceChoice,
  SURFACE_LABELS,
  SURFACE_ORDER,
  SURFACE_RAMPS,
  surfaceRamp,
  writeSurfaceChoice,
  customRamp,
  readCustomColor,
  writeCustomColor,
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

    // Mono light used to be a white card on a white field, which left the border
    // as the only thing drawing the card at all. It is a grey card now, so every
    // ramp in both themes separates the two by tone and none of them depends on
    // its border to exist. This is the assertion that would have caught the white
    // card going back in.
    it("separates card from field by tone in every option", () => {
      for (const theme of THEMES) {
        for (const choice of SURFACE_ORDER) {
          const ramp = surfaceRamp(theme, choice);
          expect(ramp.card).not.toBe(ramp.field);
          expect(
            Math.abs(luminance(ramp.card) - luminance(ramp.field)),
          ).toBeGreaterThan(0.004);
        }
      }
    });

    // A raised surface the same colour as the cards sitting on it is not raised.
    // mono light hit this the moment the card took #F4F4F5, which raised and deep
    // both already were.
    it("keeps a raised surface distinct from the cards on it", () => {
      for (const theme of THEMES) {
        for (const choice of SURFACE_ORDER) {
          const ramp = surfaceRamp(theme, choice);
          expect(ramp.raised).not.toBe(ramp.card);
        }
      }
    });

    // Grey on white is a quieter step than any of the dark ramps make, so mono
    // light still carries the strongest hairline of the four light options.
    //
    // Written against every other key rather than naming cool and warm, which is
    // what it used to do: a fourth option was added and the assertion would not have
    // noticed it, which is exactly the gap a hand-listed test leaves behind.
    it("gives mono light the strongest border of the light ramps", () => {
      const alpha = (ramp: { border: string }) =>
        Number(ramp.border.match(/,\s*([\d.]+)\s*\)$/)![1]);

      for (const choice of SURFACE_ORDER.filter((c) => c !== "mono")) {
        expect(alpha(SURFACE_RAMPS.light.mono)).toBeGreaterThan(
          alpha(SURFACE_RAMPS.light[choice]),
        );
      }
    });
  });

  describe("storage", () => {
    it("falls back to the default for anything unrecognised", () => {
      expect(parseSurfaceChoice(null)).toBe(DEFAULT_SURFACE);
      expect(parseSurfaceChoice("navy")).toBe(DEFAULT_SURFACE);
      expect(parseSurfaceChoice(7)).toBe(DEFAULT_SURFACE);
      expect(parseSurfaceChoice("warm")).toBe("warm");
    });

    // One choice, two versions: picking Ice blue in light means Navy in dark.
    it("shares one choice between light and dark", () => {
      writeSurfaceChoice("light", "cool");
      expect(readSurfaceChoice("light")).toBe("cool");
      expect(readSurfaceChoice("dark")).toBe("cool");
      expect(surfaceRamp("dark", readSurfaceChoice("dark"))).toEqual(SURFACE_RAMPS.dark.cool);
    });

    it("reads the default for a theme that has never been chosen for", () => {
      document.cookie = "listit_surface=; path=/; max-age=0";
      document.cookie = "listit_surface_light=; path=/; max-age=0";
      expect(readSurfaceChoice("light")).toBe(DEFAULT_SURFACE);
    });

    it("stores the choice in a cookie so it survives a reload", () => {
      writeSurfaceChoice("dark", "warm");
      expect(document.cookie).toContain("listit_surface=warm");
    });

    it("defaults to Midnight in dark and Grey in light", () => {
      expect(DEFAULT_SURFACE).toBe("soft");
      expect(SURFACE_RAMPS.dark.soft.field).toBe("#202024");
      expect(SURFACE_RAMPS.light.soft.field).toBe("#E8E8E8");
      expect(SURFACE_RAMPS.light.soft.card).toBe("#FFFFFF");
      expect(SURFACE_LABELS.dark.soft.label).toBe("Midnight");
      expect(SURFACE_LABELS.light.soft.label).toBe("Grey");
    });
  });

  describe("custom colour", () => {
    it("derives a ramp whose cards stand out from the chosen field", () => {
      for (const hex of ["#3366CC", "#E8E8E8", "#101010", "#FDE68A"]) {
        for (const theme of ["light", "dark"] as const) {
          const ramp = customRamp(theme, hex);
          expect(ramp.field).toBe(hex.toUpperCase());
          expect(Math.abs(luminance(ramp.card) - luminance(ramp.field))).toBeGreaterThan(0.004);
        }
      }
    });

    it("saves the colour in a cookie and paints it as the custom ramp", () => {
      writeCustomColor("light", "#3366cc");
      writeSurfaceChoice("light", "custom");
      expect(readCustomColor("light")).toBe("#3366CC");
      expect(readSurfaceChoice("light")).toBe("custom");
      expect(surfaceRamp("light", "custom").field).toBe("#3366CC");
      expect(document.cookie).toContain("listit_custom_light=");
    });

    it("saves a dark version of a colour picked in light mode, and back", () => {
      writeCustomColor("light", "#FFD7A8");
      const dark = readCustomColor("dark")!;
      expect(dark).toBeTruthy();
      expect(luminance(dark)).toBeLessThan(0.05);
      writeCustomColor("dark", "#1E3A8A");
      expect(luminance(readCustomColor("light")!)).toBeGreaterThan(0.6);
    });

    it("falls back to the default ramp when no custom colour is saved", () => {
      document.cookie = "listit_custom_dark=; path=/; max-age=0";
      expect(surfaceRamp("dark", "custom")).toEqual(SURFACE_RAMPS.dark.soft);
    });
  });
});
