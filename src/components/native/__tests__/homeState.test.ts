// Which screen the Lists tab shows, and in particular where "nothing here"
// stops meaning "make your first list".
//
// Two cases below are the ones that were actually wrong. Before this existed,
// the empty branch was gated on both the user's lists AND the built-in views
// being empty — and the built-in views are a hardcoded six-item constant that
// only the search box can empty. So the create prompt was unreachable for the
// new user it was written for, and reachable only as a search miss, where its
// wording was wrong.

import { homeState } from "../homeState";

const base = {
  isLoading: false,
  search: "",
  userListCount: 0,
  matchingListCount: 0,
  matchingDefaultCount: 6,
};

describe("homeState", () => {
  it("is loading before the first fetch resolves", () => {
    // Wins over everything else: an unfinished fetch is indistinguishable from
    // an empty account, and guessing flashes the wrong screen.
    expect(homeState({ ...base, isLoading: true })).toBe("loading");
  });

  it("is a first run when the account has no lists", () => {
    // The case the old condition could never reach: six default views are
    // present and matching, but the user still owns nothing.
    expect(homeState(base)).toBe("first-run");
  });

  it("shows lists once one exists", () => {
    expect(homeState({ ...base, userListCount: 1, matchingListCount: 1 })).toBe(
      "lists",
    );
  });

  it("is not a first run while a search is active", () => {
    // Someone with no lists who types anything is searching, not starting out —
    // offering to create a list here answers a question they did not ask.
    expect(
      homeState({ ...base, search: "shopping", matchingDefaultCount: 0 }),
    ).toBe("search-miss");
  });

  it("treats whitespace as no search at all", () => {
    expect(homeState({ ...base, search: "   " })).toBe("first-run");
  });

  it("is a search miss when a query matches nothing", () => {
    expect(
      homeState({
        ...base,
        search: "zzz",
        userListCount: 3,
        matchingListCount: 0,
        matchingDefaultCount: 0,
      }),
    ).toBe("search-miss");
  });

  it("shows lists when a query matches only a built-in view", () => {
    expect(
      homeState({
        ...base,
        search: "today",
        userListCount: 3,
        matchingListCount: 0,
        matchingDefaultCount: 1,
      }),
    ).toBe("lists");
  });
});
