import {
  SWIPE_DISTANCE_PX,
  SWIPE_VELOCITY,
  tabForSwipe,
  type PanelTab,
} from "../panelSwipe";

/** A drag that travelled but was not a flick. */
const slow = (offsetX: number, current: PanelTab = "tasks") =>
  tabForSwipe(offsetX, 0, current);

/** A flick that barely moved. */
const flick = (velocityX: number, current: PanelTab = "tasks") =>
  tabForSwipe(0, velocityX, current);

describe("tabForSwipe", () => {
  // The whole reason this is a function and not three lines in an onDragEnd.
  // Dragging left moves the content left, which brings in the tab to the right
  // of it. Inverted, the gesture still "works" and simply goes the wrong way,
  // which is not something a passing build would ever tell you.
  describe("direction", () => {
    it("goes to Notes when dragged left", () => {
      expect(slow(-200)).toBe("notes");
    });

    it("goes back to Tasks when dragged right", () => {
      expect(slow(200, "notes")).toBe("tasks");
    });

    it("flicks the same way it drags", () => {
      expect(flick(-900)).toBe("notes");
      expect(flick(900, "notes")).toBe("tasks");
    });
  });

  describe("thresholds", () => {
    it("ignores a drag that has not travelled far enough", () => {
      expect(slow(-SWIPE_DISTANCE_PX)).toBeNull();
      expect(slow(SWIPE_DISTANCE_PX, "notes")).toBeNull();
    });

    it("takes a drag one pixel past the threshold", () => {
      expect(slow(-(SWIPE_DISTANCE_PX + 1))).toBe("notes");
    });

    it("ignores a flick slower than the threshold", () => {
      expect(flick(-SWIPE_VELOCITY)).toBeNull();
    });

    // A fast swipe is over in a few frames and may never cover 56px. Without
    // this the gesture feels like it has to be dragged rather than flicked.
    it("takes a fast flick that barely moved", () => {
      expect(tabForSwipe(-4, -(SWIPE_VELOCITY + 1), "tasks")).toBe("notes");
    });
  });

  describe("staying put", () => {
    // There is nothing to the left of Tasks or the right of Notes. The panel
    // springs back and the tab does not change.
    it("refuses to walk off either end", () => {
      expect(slow(200, "tasks")).toBeNull();
      expect(slow(-200, "notes")).toBeNull();
      expect(flick(900, "tasks")).toBeNull();
      expect(flick(-900, "notes")).toBeNull();
    });

    it("does nothing when the gesture went nowhere", () => {
      expect(tabForSwipe(0, 0, "tasks")).toBeNull();
      expect(tabForSwipe(0, 0, "notes")).toBeNull();
    });

    // Dragged hard one way, flicked back the other before release: someone
    // changing their mind. Neither signal should win.
    it("cancels when offset and velocity disagree", () => {
      expect(tabForSwipe(-200, SWIPE_VELOCITY + 100, "tasks")).toBeNull();
      expect(tabForSwipe(200, -(SWIPE_VELOCITY + 100), "notes")).toBeNull();
    });
  });
});
