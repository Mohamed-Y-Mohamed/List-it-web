// How the tutorial flag is read and written.
//
// The case worth pinning down is the failure path. fetchTutorialSeen reports
// "seen" whenever it cannot get a straight answer, which is the opposite of what
// lib/onboarding.ts does with its localStorage flag. Getting that backwards
// would put the walkthrough in front of an established user every time their
// connection wobbled, and nothing about the happy path would look wrong.

const apiFetch = jest.fn();

jest.mock("@/lib/apiFetch", () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

// Everything in tutorial.ts is inert off-native.
jest.mock("@/lib/platform", () => ({
  IS_NATIVE_BUILD: true,
}));

import { fetchTutorialSeen, markTutorialSeen } from "@/lib/tutorial";

const SEEN_KEY = "listit.tutorial.seen";

function respondWith(body: unknown, ok = true) {
  apiFetch.mockResolvedValue({ ok, json: async () => body });
}

beforeEach(() => {
  apiFetch.mockReset();
  window.localStorage.clear();
});

describe("fetchTutorialSeen", () => {
  it("is false for a new account, so the tutorial shows", async () => {
    respondWith({ data: { tutorial: false } });
    await expect(fetchTutorialSeen()).resolves.toBe(false);
  });

  it("is true once the account has been through it", async () => {
    respondWith({ data: { tutorial: true } });
    await expect(fetchTutorialSeen()).resolves.toBe(true);
  });

  it("treats a null flag as not seen", async () => {
    // The column is nullable, and a row written before the default existed comes
    // back as null rather than false.
    respondWith({ data: { tutorial: null } });
    await expect(fetchTutorialSeen()).resolves.toBe(false);
  });

  it("reports seen when the request fails", async () => {
    apiFetch.mockRejectedValue(new Error("offline"));
    await expect(fetchTutorialSeen()).resolves.toBe(true);
  });

  it("reports seen on a non-OK response", async () => {
    respondWith({ error: "unauthorised" }, false);
    await expect(fetchTutorialSeen()).resolves.toBe(true);
  });

  it("short-circuits on the local flag without asking the server", async () => {
    window.localStorage.setItem(SEEN_KEY, "true");
    await expect(fetchTutorialSeen()).resolves.toBe(true);
    expect(apiFetch).not.toHaveBeenCalled();
  });
});

describe("markTutorialSeen", () => {
  it("patches the flag to true", async () => {
    respondWith({ data: { tutorial: true } });
    await markTutorialSeen();

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/user/profile",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ tutorial: true }),
      }),
    );
  });

  it("records it locally even when the write fails", async () => {
    // The guard that stops a dropped PATCH putting the tutorial back up on the
    // next launch while the server still reads false.
    apiFetch.mockRejectedValue(new Error("offline"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    await markTutorialSeen();

    expect(window.localStorage.getItem(SEEN_KEY)).toBe("true");
    await expect(fetchTutorialSeen()).resolves.toBe(true);
  });
});
