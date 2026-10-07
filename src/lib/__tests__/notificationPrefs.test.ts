// What the notification preferences do with a value they did not write.
//
// The case that matters is a stored value whose `remindersEnabled` is not a
// boolean. `parseNotificationPrefs` is the only thing standing between
// localStorage and the switch, and a cast would have let `undefined` or the
// string "false" through, where the first makes `aria-checked` meaningless to a
// screen reader and the second reads as on because a non-empty string is truthy.

import {
  DEFAULT_NOTIFICATION_PREFS,
  parseNotificationPrefs,
  readNotificationPrefs,
  writeNotificationPrefs,
} from "@/lib/notificationPrefs";

const STORAGE_KEY = "listit.notificationPrefs";

beforeEach(() => {
  window.localStorage.clear();
});

describe("parseNotificationPrefs", () => {
  it("accepts both states", () => {
    expect(parseNotificationPrefs({ remindersEnabled: true })).toEqual({
      remindersEnabled: true,
    });
    expect(parseNotificationPrefs({ remindersEnabled: false })).toEqual({
      remindersEnabled: false,
    });
  });

  it("falls back for anything else", () => {
    // null is the ordinary case — nothing stored yet. The rest are what a stale
    // or hand-edited key looks like.
    expect(parseNotificationPrefs(null)).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(parseNotificationPrefs(undefined)).toEqual(
      DEFAULT_NOTIFICATION_PREFS
    );
    expect(parseNotificationPrefs("false")).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(parseNotificationPrefs({})).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(parseNotificationPrefs({ remindersEnabled: "no" })).toEqual(
      DEFAULT_NOTIFICATION_PREFS
    );
    expect(parseNotificationPrefs({ remindersEnabled: 0 })).toEqual(
      DEFAULT_NOTIFICATION_PREFS
    );
  });

  it("defaults to delivering reminders", () => {
    // Pinned deliberately: changing this silently stops reminders for every
    // existing install that has never opened the setting.
    expect(DEFAULT_NOTIFICATION_PREFS.remindersEnabled).toBe(true);
  });
});

describe("readNotificationPrefs", () => {
  it("is the default before anything is chosen", () => {
    expect(readNotificationPrefs()).toEqual({ remindersEnabled: true });
  });

  it("reads back what was written", () => {
    writeNotificationPrefs({ remindersEnabled: false });
    expect(readNotificationPrefs()).toEqual({ remindersEnabled: false });
  });

  it("survives a value that is not JSON", () => {
    // `JSON.parse` throws rather than returning null, so this is the case that
    // would take the screen down if the read were not wrapped.
    window.localStorage.setItem(STORAGE_KEY, "{remindersEnabled:");
    expect(readNotificationPrefs()).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it("ignores a stored object without the key", () => {
    // What an older or partially written value looks like.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ sound: true }));
    expect(readNotificationPrefs()).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it("ignores a stored value that is not a boolean", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ remindersEnabled: "false" })
    );
    expect(readNotificationPrefs()).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });
});
