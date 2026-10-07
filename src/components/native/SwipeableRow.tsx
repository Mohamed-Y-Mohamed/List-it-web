"use client";

// Horizontal swipe actions for a task row or a note card, the way the iOS app and
// every other Android list does it: drag the row aside to reveal a button behind
// it, tap the button, or let go and have the row spring back.
//
// Nothing in the app had any swipe or pan handling before this. The only gesture
// was long-press-for-context-menu, and the only `drag` props in the codebase were
// in NativeSheet — which was never imported anywhere. The drag thresholds here are
// taken from that file so the two feel like the same product.
//
// ---------------------------------------------------------------------------
// Coexisting with long-press
//
// useLongPress is built on Pointer Events and arms a 500ms timer, cancelling it
// once a press travels more than 10px. A horizontal drag crosses that in the first
// few frames, so the two gestures compose without either needing to know about the
// other — the swipe disarms the long press by moving, and a stationary press is
// never a swipe.
//
// Vertical scrolling is protected by `touch-action: pan-y`, which tells the browser
// it still owns vertical panning. Without it framer's pointer capture fights the
// scroller and the list feels sticky.
//
// This exposes no new capability: every action it reveals is a handler the row
// already had. It is a second, faster route to the same thing.
//
// Native only.

import React, { useCallback, useState } from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import type { LucideIcon } from "lucide-react";
import { isNativeApp } from "@/lib/platform";

/**
 * How far the row slides to reveal one action.
 *
 * The labelled panel needs room for a word under the glyph; an icon-only one needs
 * only a comfortable target, and three of those have to fit beside the row's own
 * content on a phone. 56 clears the 44px minimum with air to spare, so three come
 * to 168px and still leave over half of a 390px screen showing the row.
 */
const ACTION_WIDTH = 88;
const ICON_ACTION_WIDTH = 56;

/**
 * Air between the panels, and between the first panel and the row itself.
 *
 * Flush against each other they read as one striped block and the eye has to find
 * the seams to tell three buttons from one. Separated, each is visibly its own
 * target, which matters most for the one that deletes.
 */
const ACTION_GAP = 6;

// Matched to NativeSheet's dismissal feel: a flick opens it even if it has barely
// moved, and a slow drag has to cross a third of the action's width.
const OPEN_VELOCITY = 500;
const OPEN_FRACTION = 0.33;

export interface SwipeAction {
  label: string;
  icon: LucideIcon;
  /** Tailwind background class for the revealed panel. */
  background: string;
  onAction: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  /** Revealed by dragging right. Sits against the leading edge, as on iOS. */
  leading?: SwipeAction | SwipeAction[];
  /** Revealed by dragging left. Sits against the trailing edge. */
  trailing?: SwipeAction | SwipeAction[];
  /**
   * Whether each panel shows its label under the glyph. Off gives icon-only
   * panels, which is what makes room for more than one action on a side.
   *
   * The label is still the button's accessible name either way, so turning it off
   * changes what is drawn and nothing about what a screen reader announces.
   */
  showLabels?: boolean;
  /**
   * Corner radius of the clip applied while the row is open, as a Tailwind class.
   *
   * It has to match the radius of the child, or the child's corners visibly square
   * off the moment a swipe starts. The default is the task and note card's
   * `rounded-xl`; the list rows on the Lists tab are `rounded-2xl` and say so.
   */
  radiusClass?: string;
}

/** One action and a list of one read the same from here down. */
const toActions = (value?: SwipeAction | SwipeAction[]): SwipeAction[] =>
  value ? (Array.isArray(value) ? value : [value]) : [];

export default function SwipeableRow({
  children,
  leading,
  trailing,
  showLabels = true,
  radiusClass = "rounded-xl",
}: SwipeableRowProps) {
  const [open, setOpen] = useState<"leading" | "trailing" | null>(null);
  const [dragging, setDragging] = useState(false);
  const reduceMotion = useReducedMotion();

  const leadingActions = toActions(leading);
  const trailingActions = toActions(trailing);

  // How far the row travels to open each side: a panel plus its gap per action.
  const panelWidth = showLabels ? ACTION_WIDTH : ICON_ACTION_WIDTH;
  const slotWidth = panelWidth + ACTION_GAP;
  const leadingWidth = leadingActions.length * slotWidth;
  const trailingWidth = trailingActions.length * slotWidth;

  // Whether the action panels exist in the DOM at all.
  //
  // They are mounted only while the row is actually being swiped or is held open,
  // and this is load-bearing rather than an optimisation. A task card is
  // `bg-gray-800/50` and a note card's gradient tops out at 87% opacity — both are
  // translucent, so a panel sitting permanently behind them showed *through* the
  // card: a red Delete bleeding into a task at rest. Card appearance at rest is now
  // byte-for-byte what it was before swipe existed, because at rest there is
  // nothing behind it.
  const revealed = dragging || open !== null;

  const close = useCallback(() => setOpen(null), []);

  const handleDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      setDragging(false);

      const { offset, velocity } = info;

      // A fraction of one panel, not of the whole side. Three actions should not
      // take three times the drag to commit to: the distance that says "this is a
      // swipe, not a scroll" is the same whatever is waiting behind the row.
      const past = panelWidth * OPEN_FRACTION;

      // A flick counts even when the finger barely travelled, which is what makes
      // the gesture feel responsive rather than laborious.
      const wantsTrailing =
        trailingWidth > 0 && (offset.x < -past || velocity.x < -OPEN_VELOCITY);
      const wantsLeading =
        leadingWidth > 0 && (offset.x > past || velocity.x > OPEN_VELOCITY);

      const next = wantsTrailing ? "trailing" : wantsLeading ? "leading" : null;

      if (next && next !== open && isNativeApp()) {
        // The row is under the user's finger, so the confirmation has to be felt
        // rather than seen. Same weight useLongPress uses when its menu opens.
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }

      setOpen(next);
    },
    [leadingWidth, trailingWidth, panelWidth, open],
  );

  const fire = useCallback((action: SwipeAction) => {
    setOpen(null);
    action.onAction();
  }, []);

  const targetX =
    open === "trailing"
      ? -trailingWidth
      : open === "leading"
        ? leadingWidth
        : 0;

  // Only the sides that actually have an action can be dragged towards, so a row
  // with one action cannot be pulled open in a direction that reveals nothing.
  const dragConstraints = {
    left: -trailingWidth,
    right: leadingWidth,
  };

  // Edge classes written out rather than composed from `side`. Tailwind generates
  // utilities by scanning source text, so `${side}-0` would never be emitted — the
  // same trap that left half the task-card palette missing from the stylesheet.
  // The width is an inline style for the same reason, since it has to agree with
  // the constants above.
  const EDGE_CLASS = { leading: "left-0", trailing: "right-0" } as const;

  const renderActions = (
    actions: SwipeAction[],
    side: "leading" | "trailing",
  ) => (
    // One strip pinned to the edge, panels laid out inside it in the order given.
    // Passing the destructive action last puts it against the outer edge, furthest
    // from where a leftward thumb first lands.
    //
    // Nothing fires on reveal: a panel still has to be tapped. That is what lets
    // delete sit here at all, and it is why the strip needs no undo of its own.
    <div
      className={`absolute inset-y-0 ${EDGE_CLASS[side]} flex items-stretch`}
      style={{
        width: actions.length * slotWidth,
        gap: ACTION_GAP,
        // The same gap again on the side the row slides away from, so the first
        // panel is not left welded to the card's edge.
        [side === "trailing" ? "paddingLeft" : "paddingRight"]: ACTION_GAP,
      }}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            onClick={() => fire(action)}
            aria-label={action.label}
            // Fills the strip's height so the target is the whole panel rather
            // than just the glyph. Rounded now that the panels stand apart: a
            // square tile beside a rounded card reads as a rendering mistake.
            className={`flex h-full flex-col items-center justify-center gap-1 rounded-[14px] text-white ${action.background}`}
            style={{ width: panelWidth }}
            // Kept out of the tab order until revealed: a keyboard or screen-reader
            // user reaches these actions through the row's own controls, not by
            // swiping, so an always-focusable duplicate would just be noise.
            tabIndex={open === side ? 0 : -1}
          >
            <Icon className="h-5 w-5" />
            {showLabels && (
              <span className="text-[11px] font-semibold">{action.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    // The clip is conditional for the same reason the panels are. `overflow-hidden`
    // is needed once the row starts moving, or the card slides out past the edge of
    // the collection it sits in — but at rest it would clip the card's own
    // `hover:shadow-xl`, which is a visible change to a card nobody is touching.
    <div
      className={`relative ${revealed ? `overflow-hidden ${radiusClass}` : ""}`}
    >
      {revealed &&
        leadingActions.length > 0 &&
        renderActions(leadingActions, "leading")}
      {revealed &&
        trailingActions.length > 0 &&
        renderActions(trailingActions, "trailing")}

      <motion.div
        drag="x"
        onDragStart={() => setDragging(true)}
        dragConstraints={dragConstraints}
        // Just enough give at the closed position to feel physical, and none past
        // a fully open action — pulling further should meet resistance, not wander.
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={{ x: targetX }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 500, damping: 40 }
        }
        // pan-y leaves vertical scrolling to the browser. Without it the list
        // stutters, because framer captures the pointer for gestures that were
        // only ever meant to scroll.
        style={{ touchAction: "pan-y", position: "relative" }}
      >
        {children}

        {/* While an action is showing, a tap anywhere on the row closes it instead
            of opening the row's own detail sheet. Without this the first tap after
            a swipe does something the user did not ask for. */}
        {open && (
          <button
            type="button"
            aria-label="Close swipe actions"
            onClick={close}
            className="absolute inset-0 z-10 cursor-default"
          />
        )}
      </motion.div>
    </div>
  );
}
