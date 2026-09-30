// components/native/homeState.ts
// Which of the four things the Lists screen is showing.
//
// Pulled out of NativeHome for the same reason navTabs was: it is a rule rather
// than markup, the cases interact in a way that is easy to get subtly wrong, and
// a pure function can be tested without standing up a screen full of contexts.
//
// The case that motivated it: "no lists" and "a search that matched nothing"
// used to be one branch, so searching for a word no list contained offered to
// create a list — which is not what someone who has just typed a query wants.

export type HomeState = "loading" | "first-run" | "search-miss" | "lists";

export interface HomeStateInput {
  isLoading: boolean;
  /** Raw contents of the search box; trimmed here so callers need not. */
  search: string;
  /** The user's own lists, before the search filter. */
  userListCount: number;
  /** The user's lists left after the search filter. */
  matchingListCount: number;
  /** Built-in views left after the search filter. */
  matchingDefaultCount: number;
}

/**
 * Note the order: loading wins over everything, because an unfinished fetch
 * looks identical to an empty account and guessing wrong flashes the wrong
 * screen. `first-run` is then decided on the unfiltered count, so an active
 * search can never be mistaken for having nothing.
 */
export function homeState({
  isLoading,
  search,
  userListCount,
  matchingListCount,
  matchingDefaultCount,
}: HomeStateInput): HomeState {
  if (isLoading) return "loading";

  const isSearching = search.trim().length > 0;

  if (!isSearching && userListCount === 0) return "first-run";
  if (isSearching && matchingListCount === 0 && matchingDefaultCount === 0) {
    return "search-miss";
  }

  return "lists";
}
