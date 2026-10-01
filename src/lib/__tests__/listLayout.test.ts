// What the Lists tab layout preference does with a value it did not write.
//
// The case that matters is a stored value that is not one of the two layouts.
// `parseListLayout` is the only thing standing between localStorage and a
// `grid-cols-*` class name, and a cast would have let "" or a stale key through to
// the screen, where it renders as a collapsed single column with no error.

import {
  DEFAULT_LIST_LAYOUT,
  parseListLayout,
  readListLayout,
  writeListLayout,
} from "@/lib/listLayout";

const STORAGE_KEY = "listit.listLayout";

beforeEach(() => {
  window.localStorage.clear();
});

describe("parseListLayout", () => {
  it("accepts both layouts", () => {
    expect(parseListLayout("cards")).toBe("cards");
    expect(parseListLayout("list")).toBe("list");
  });

  it("falls back for anything else", () => {
    // null is the ordinary case — nothing stored yet. The rest are what a stale
    // or hand-edited key looks like.
    expect(parseListLayout(null)).toBe(DEFAULT_LIST_LAYOUT);
    expect(parseListLayout("")).toBe(DEFAULT_LIST_LAYOUT);
    expect(parseListLayout("grid")).toBe(DEFAULT_LIST_LAYOUT);
    expect(parseListLayout(undefined)).toBe(DEFAULT_LIST_LAYOUT);
    expect(parseListLayout(2)).toBe(DEFAULT_LIST_LAYOUT);
  });

  it("defaults to the grid the screen has always shown", () => {
    // Pinned deliberately: changing this flips the layout for every existing
    // install that has never opened the setting.
    expect(DEFAULT_LIST_LAYOUT).toBe("cards");
  });
});

describe("readListLayout", () => {
  it("is the default before anything is chosen", () => {
    expect(readListLayout()).toBe("cards");
  });

  it("reads back what was written", () => {
    writeListLayout("list");
    expect(readListLayout()).toBe("list");
  });

  it("ignores a stored value it does not recognise", () => {
    window.localStorage.setItem(STORAGE_KEY, "rows");
    expect(readListLayout()).toBe(DEFAULT_LIST_LAYOUT);
  });
});
