import {
  firstOfMonth,
  isSameDay,
  isSameMonth,
  monthGrid,
  startOfDay,
  weekdaySymbols,
} from "@/lib/calendarMonth";

describe("firstOfMonth", () => {
  it("returns midnight on the 1st", () => {
    const result = firstOfMonth(new Date(2026, 9, 17, 16, 30));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(9);
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(0);
  });
});

describe("startOfDay", () => {
  it("strips the clock time", () => {
    const result = startOfDay(new Date(2026, 9, 17, 23, 59, 59));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getDate()).toBe(17);
  });
});

describe("isSameDay", () => {
  it("ignores the time of day", () => {
    expect(
      isSameDay(new Date(2026, 9, 17, 1), new Date(2026, 9, 17, 23)),
    ).toBe(true);
  });

  it("separates the same date in different months", () => {
    expect(isSameDay(new Date(2026, 8, 17), new Date(2026, 9, 17))).toBe(false);
  });

  it("separates the same date in different years", () => {
    expect(isSameDay(new Date(2025, 9, 17), new Date(2026, 9, 17))).toBe(false);
  });
});

describe("isSameMonth", () => {
  it("matches any two days of one month", () => {
    expect(isSameMonth(new Date(2026, 9, 1), new Date(2026, 9, 31))).toBe(true);
  });

  it("does not match the same month a year apart", () => {
    expect(isSameMonth(new Date(2025, 9, 1), new Date(2026, 9, 1))).toBe(false);
  });
});

describe("monthGrid", () => {
  it("pads a Monday-first grid to the weekday the month starts on", () => {
    // 1 October 2026 is a Thursday, so a Monday-first grid needs three blanks.
    const cells = monthGrid(new Date(2026, 9, 1));

    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]).toBeInstanceOf(Date);
    expect((cells[3] as Date).getDate()).toBe(1);
  });

  it("needs no padding when the month starts on the grid's first weekday", () => {
    // 1 June 2026 is a Monday.
    const cells = monthGrid(new Date(2026, 5, 1));

    expect(cells[0]).toBeInstanceOf(Date);
    expect((cells[0] as Date).getDate()).toBe(1);
  });

  it("pads a Sunday-first grid differently from a Monday-first one", () => {
    const monday = monthGrid(new Date(2026, 9, 1), 1);
    const sunday = monthGrid(new Date(2026, 9, 1), 0);

    expect(monday.filter((cell) => cell === null)).toHaveLength(3);
    expect(sunday.filter((cell) => cell === null)).toHaveLength(4);
  });

  it("holds every day of the month and no more", () => {
    const days = monthGrid(new Date(2026, 9, 1)).filter(Boolean);
    expect(days).toHaveLength(31);
    expect((days[30] as Date).getDate()).toBe(31);
  });

  it("gets February right in a leap year", () => {
    const days = monthGrid(new Date(2028, 1, 1)).filter(Boolean);
    expect(days).toHaveLength(29);
  });

  it("gets February right in a common year", () => {
    const days = monthGrid(new Date(2026, 1, 1)).filter(Boolean);
    expect(days).toHaveLength(28);
  });

  it("takes any day of the month, not only the 1st", () => {
    const fromFirst = monthGrid(new Date(2026, 9, 1));
    const fromMiddle = monthGrid(new Date(2026, 9, 17, 14, 0));
    expect(fromMiddle).toHaveLength(fromFirst.length);
  });

  it("returns days at midnight, so they compare cleanly", () => {
    const first = monthGrid(new Date(2026, 9, 1)).find(Boolean) as Date;
    expect(first.getHours()).toBe(0);
  });
});

describe("weekdaySymbols", () => {
  it("returns seven labels", () => {
    expect(weekdaySymbols()).toHaveLength(7);
  });

  it("starts on Monday by default", () => {
    expect(weekdaySymbols(1, "en-GB")[0]).toBe("M");
  });

  it("starts on Sunday when asked", () => {
    expect(weekdaySymbols(0, "en-GB")[0]).toBe("S");
  });

  it("ends on Sunday in a Monday-first week", () => {
    expect(weekdaySymbols(1, "en-GB")[6]).toBe("S");
  });
});
