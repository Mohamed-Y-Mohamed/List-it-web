import { passwordError, PASSWORD_MIN_LENGTH } from "@/lib/password";

// These cases mirror what the project's own Supabase auth settings were
// measured to do, so a drift between the two shows up here rather than as a
// raw auth-server message in front of a user.
describe("passwordError", () => {
  it("accepts a password meeting every rule", () => {
    expect(passwordError("Aa1!bcde")).toBeNull();
  });

  it("rejects anything shorter than the minimum, even with all four classes", () => {
    expect(passwordError("Aa1!bcd")).toMatch(/at least 8 characters/i);
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  it("rejects a long password missing a class", () => {
    expect(passwordError("abcdefgh1!")).toMatch(/uppercase/i);
    expect(passwordError("ABCDEFGH1!")).toMatch(/lowercase/i);
    expect(passwordError("Abcdefgh!!")).toMatch(/number/i);
    expect(passwordError("Abcdefgh12")).toMatch(/symbol/i);
  });

  it("reports length before anything else, since that is the common miss", () => {
    expect(passwordError("abc")).toMatch(/at least 8 characters/i);
  });

  it("accepts the symbols the auth server accepts", () => {
    for (const symbol of ["!", "@", "-", "_", "?", ".", "~", "|"]) {
      expect(passwordError(`Abcdefg1${symbol}`)).toBeNull();
    }
  });

  it("treats an empty password as too short rather than throwing", () => {
    expect(passwordError("")).toMatch(/at least 8 characters/i);
  });
});
