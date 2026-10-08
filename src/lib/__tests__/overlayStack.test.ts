import { dismissTopOverlay, pushOverlay } from "../overlayStack";

// The back button spends itself on an overlay or on the router, never both, and
// which one it is comes down to this stack being right. The ordering cases below
// are the ones a dialog raised over another dialog actually produces.

describe("overlayStack", () => {
  it("reports nothing to dismiss when no overlay is open", () => {
    expect(dismissTopOverlay()).toBe(false);
  });

  it("dismisses the overlay that is open and consumes the press", () => {
    const close = jest.fn();
    const unregister = pushOverlay(close);

    expect(dismissTopOverlay()).toBe(true);
    expect(close).toHaveBeenCalledTimes(1);

    unregister();
  });

  it("dismisses the topmost first, so a confirm over a form closes the confirm", () => {
    const closeForm = jest.fn();
    const closeConfirm = jest.fn();
    const unregisterForm = pushOverlay(closeForm);
    const unregisterConfirm = pushOverlay(closeConfirm);

    dismissTopOverlay();
    expect(closeConfirm).toHaveBeenCalledTimes(1);
    expect(closeForm).not.toHaveBeenCalled();

    unregisterConfirm();
    dismissTopOverlay();
    expect(closeForm).toHaveBeenCalledTimes(1);

    unregisterForm();
  });

  it("removes the entry that unregistered, not whichever is on the end", () => {
    // Overlays do not always close in the order they opened: dismissing the form
    // underneath while a confirm is still up must not strand the confirm.
    const closeForm = jest.fn();
    const closeConfirm = jest.fn();
    const unregisterForm = pushOverlay(closeForm);
    const unregisterConfirm = pushOverlay(closeConfirm);

    unregisterForm();

    expect(dismissTopOverlay()).toBe(true);
    expect(closeConfirm).toHaveBeenCalledTimes(1);
    expect(closeForm).not.toHaveBeenCalled();

    // Dismissing does not unregister: the overlay leaves the stack through its own
    // effect cleanup when `isOpen` turns false, which is what this stands in for.
    // Removing it here instead would let a second back press in the same frame —
    // before React has re-rendered — fall through to the router.
    unregisterConfirm();
    expect(dismissTopOverlay()).toBe(false);
  });

  it("still consumes the press when the overlay refuses to close", () => {
    // What a sheet does while a write is in flight. Back must do nothing at all
    // rather than fall through and navigate away from the save.
    const refuse = jest.fn();
    const unregister = pushOverlay(refuse);

    expect(dismissTopOverlay()).toBe(true);
    expect(refuse).toHaveBeenCalledTimes(1);

    unregister();
  });
});
