/** @jest-environment node */

// Which paths are tab roots.
//
// Three separate things read this: the tab bar decides whether to render at all,
// NativeBackBar decides whether to draw a chevron, and NativeShell decides
// whether hardware back exits, switches tab, or rewinds. They disagreeing is how
// you end up with a back arrow and a tab bar both claiming the same screen, so
// the rule lives in one place and is tested here.

import { HOME_TAB_PATH, isTabRoot, NAV_TABS, normalisePath } from "../navTabs";

describe("normalisePath", () => {
  it("strips the trailing slash the static export adds", () => {
    expect(normalisePath("/stats/")).toBe("/stats");
  });

  it("leaves a slashless path alone", () => {
    expect(normalisePath("/stats")).toBe("/stats");
  });

  it("keeps the root as a single slash rather than an empty string", () => {
    expect(normalisePath("/")).toBe("/");
  });
});

describe("isTabRoot", () => {
  it.each(NAV_TABS.map((tab) => tab.path))("treats %s as a root", (path) => {
    expect(isTabRoot(path)).toBe(true);
  });

  it.each(NAV_TABS.map((tab) => `${tab.path}/`))(
    "treats %s as a root too, trailing slash and all",
    (path) => {
      expect(isTabRoot(path)).toBe(true);
    }
  );

  it.each(["/today", "/overdue", "/List", "/login", "/"])(
    "does not treat %s as a root",
    (path) => {
      expect(isTabRoot(path)).toBe(false);
    }
  );

  it("does not match a screen pushed below a tab root", () => {
    // /stats is a root; something under it is not, or back would exit from it.
    expect(isTabRoot("/stats/detail")).toBe(false);
  });
});

describe("the tab set itself", () => {
  it("has three destinations, the range bottom tabs are correct for", () => {
    expect(NAV_TABS).toHaveLength(3);
  });

  it("opens on Lists, which is also where hardware back falls through to", () => {
    expect(NAV_TABS[0].path).toBe(HOME_TAB_PATH);
    expect(isTabRoot(HOME_TAB_PATH)).toBe(true);
  });

  it("keeps the routes the web already serves, so nothing moves for the site", () => {
    expect(NAV_TABS.map((tab) => tab.path)).toEqual([
      "/dashboard",
      "/stats",
      "/setting",
    ]);
  });

  it("labels the analytics tab Progress while leaving its route at /stats", () => {
    const progress = NAV_TABS.find((tab) => tab.label === "Progress");
    expect(progress?.path).toBe("/stats");
  });
});
