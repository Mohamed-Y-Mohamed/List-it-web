// lib/helpTopics.ts
// The app's explanatory copy, in one place.
//
// Two surfaces show it, in opposite orders, and both read from here so the copy
// cannot drift:
//
//   * the first-run walkthrough — once per account, full screen, with an
//     illustration per step. Oldest first, because it is teaching someone who has
//     never opened the app, and newly added features belong after the basics.
//   * the help sheet on the Lists tab — on demand, any time. Newest first, because
//     whoever opens it has already used the app and came looking for what changed.
//
// Adding a feature therefore means one entry appended to RECENT_TOPICS. It lands at
// the end of the walkthrough and the top of the help sheet on its own.
//
// The walkthrough pairs each topic with an illustration by `id`. A topic with no
// illustration is skipped there and still appears in the help sheet, so copy can go
// in before the drawing does.
//
// Every label quoted below is the one actually on screen. "Create Collection",
// "Create Task" and "Create Note" come from ListFilter's menu; "List layout" comes
// from the Appearance section of Settings. Teaching a synonym for a button the user
// is about to go looking for is worse than not teaching it, so if one of those is
// renamed, rename it here too.

export interface HelpTopic {
  id: string;
  title: string;
  body: string;
}

/**
 * What the first-run walkthrough teaches, in the order it teaches it.
 *
 * The order is load-bearing: it goes list, open, add, group, tasks, notes, find,
 * which is the order someone actually meets the app in.
 */
export const WALKTHROUGH_TOPICS: readonly HelpTopic[] = [
  {
    id: "create-list",
    title: "Start with a list",
    body: "A list is where everything goes. It can be a project, a room, or a shop. Tap the plus at the top of the Lists tab to make your first one.",
  },
  {
    id: "open-list",
    title: "Open it",
    body: "Tap a list to go inside. Press and hold it instead to pin, rename or delete it.",
  },
  {
    id: "create-menu",
    title: "Adding things",
    body: "Inside a list, the circled plus in the corner creates everything. Create Collection, Create Task and Create Note are all in that menu.",
  },
  {
    id: "collections",
    title: "Collections group your work",
    body: "A collection keeps related things together. Every new list starts with one called General. Use its Tasks and Notes tabs to switch between the two.",
  },
  {
    id: "tasks",
    title: "Tasks get ticked off",
    body: "Create Task adds a task to a collection. Tap the circle when it is done. Give it a date, and add a reminder if you want telling.",
  },
  {
    id: "notes",
    title: "Notes keep the rest",
    body: "Create Note is for anything you want to keep but do not need to tick off. Notes sit under the Notes tab of the same collection, and you can give each one a colour.",
  },
  {
    id: "default-views",
    title: "Find things again",
    body: "Tap the ⋯ beside Your Lists for the built-in views: Today, Tomorrow, Priority, Completed, Not Completed, Scheduled and Overdue. Each one gathers matching tasks from every list you own, so nothing gets lost at the bottom of a long one.",
  },
] as const;

/**
 * Features added after the original seven, oldest of them first.
 *
 * Append here. Nothing else needs changing: the walkthrough picks these up at the
 * end and the help sheet at the top, both from the two exports below.
 */
export const RECENT_TOPICS: readonly HelpTopic[] = [
  {
    id: "list-layout",
    title: "Cards or rows, your choice",
    body: "Settings has an Appearance section with a List layout setting. Cards keeps the grid you are used to. List gives each of your lists its own full-width row, with the built-in views in two columns above them.",
  },
  {
    id: "hold-actions",
    title: "Hold anything for its actions",
    body: "Press and hold a task for pin, details, mark done and delete. Hold a note for pin and delete, and a list for pin, rename and delete. Tap instead to open it. This replaces the swipe the rows used to have, so one sideways drag can mean one thing.",
  },
  {
    id: "reminders",
    title: "Reminders, when you want them",
    body: "A task can carry one reminder: open it and pick the day and the time you want telling. It can be any time between now and the end of the day the task is due. Change your mind and Remind Again sets another. You can switch all reminders off in Settings without losing them.",
  },
  {
    id: "switch-tabs",
    title: "Swipe between Tasks and Notes",
    body: "Inside a collection, swipe the tasks sideways to bring in its notes, and back the other way to return. The Tasks and Notes buttons still do the same thing if you would rather tap.",
  },
  {
    id: "scheduled",
    title: "Scheduled is a month at a glance",
    body: "Scheduled is a calendar. Every day holding work carries a dot, and tapping one lists what is due that day, so you can plan a week rather than read a list. Overdue is its own screen again and holds only what has already slipped.",
  },
  {
    id: "backgrounds",
    title: "Pick the background",
    body: "Settings has an Appearance section with four backgrounds for each theme. Dark gives you Black, Midnight, Navy and Midnight Velvet; light gives you White, Cream, Ice blue and Warm paper. The choice is remembered per theme, so dark and light can look however you like independently.",
  },
  {
    id: "completed-timeline",
    title: "Completed, day by day",
    body: "Completed groups everything you have finished under the day you finished it, newest first, with the time beside each one. Filter it to a single list, or search it by the collection a task sat in. Anything ticked off today can be undone from here, and goes straight back where it was.",
  },
  {
    id: "dates-and-times",
    title: "Dates are days",
    body: "A due date is a day, not a time of day — that is the part a reminder is for. Give a task a date and it turns up under Today, Tomorrow or Scheduled on the day it is due, and moves to Overdue once that day has passed.",
  },
] as const;

/** What the first-run walkthrough teaches: the basics, then whatever came later. */
export const TUTORIAL_TOPICS: readonly HelpTopic[] = [
  ...WALKTHROUGH_TOPICS,
  ...RECENT_TOPICS,
] as const;

/** What the help sheet shows: whatever came later, then the basics. */
export const HELP_TOPICS: readonly HelpTopic[] = [
  ...RECENT_TOPICS,
  ...WALKTHROUGH_TOPICS,
] as const;
