import { Easing, interpolate } from "remotion";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { Pre, HighlightedCode, AnnotationHandler } from "codehike/code";
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";

import {
  calculateTransitions,
  getStartingSnapshot,
  TokenTransitionsSnapshot,
} from "codehike/utils/token-transitions";
import { applyStyle } from "./utils";
import { callout } from "./annotations/Callout";

import { tokenTransitions } from "./annotations/InlineToken";
import { errorInline, errorMessage } from "./annotations/Error";
import { fontFamily, fontSize, tabSize } from "./font";

export function CodeTransition({
  oldCode,
  newCode,
  durationInFrames = 30,
  transitionDelayInFrames = 0,
}: {
  readonly oldCode: HighlightedCode | null;
  readonly newCode: HighlightedCode;
  readonly durationInFrames?: number;
  readonly transitionDelayInFrames?: number;
}) {
  const frame = useCurrentFrame();

  const ref = React.useRef<HTMLPreElement>(null);
  const [oldSnapshot, setOldSnapshot] =
    useState<TokenTransitionsSnapshot | null>(null);
  const [handle] = React.useState(() => delayRender());

  const prevCode: HighlightedCode = useMemo(() => {
    return oldCode || { ...newCode, tokens: [], annotations: [] };
  }, [newCode, oldCode]);

  // Only show new code after the transition delay has passed
  const shouldShowNewCode = frame >= transitionDelayInFrames;

  const code = useMemo(() => {
    if (!oldSnapshot) return prevCode;
    return shouldShowNewCode ? newCode : prevCode;
  }, [newCode, prevCode, oldSnapshot, shouldShowNewCode]);

  useEffect(() => {
    if (!oldSnapshot) {
      setOldSnapshot(getStartingSnapshot(ref.current!));
    }
  }, [oldSnapshot]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!oldSnapshot) {
      setOldSnapshot(getStartingSnapshot(ref.current!));
      return;
    }

    // Don't start transitions until after the delay
    if (frame < transitionDelayInFrames) {
      return;
    }

    const transitions = calculateTransitions(ref.current!, oldSnapshot);
    transitions.forEach(({ element, keyframes, options }) => {
      const delay = transitionDelayInFrames + durationInFrames * options.delay;
      const duration = durationInFrames * options.duration;
      const linearProgress = interpolate(
        frame,
        [delay, delay + duration],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );
      const progress = interpolate(linearProgress, [0, 1], [0, 1], {
        easing: Easing.bezier(0.17, 0.67, 0.76, 0.91),
      });

      applyStyle({
        element,
        keyframes,
        progress,
        linearProgress,
      });
    });
    continueRender(handle);
  });

  const handlers: AnnotationHandler[] = useMemo(() => {
    return [tokenTransitions, callout, errorInline, errorMessage];
  }, []);

  const style: React.CSSProperties = useMemo(() => {
    return {
      position: "relative",
      fontSize,
      lineHeight: 1.5,
      fontFamily,
      tabSize,
    };
  }, []);

  return <Pre ref={ref} code={code} handlers={handlers} style={style} />;
}