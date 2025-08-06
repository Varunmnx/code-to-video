import { AbsoluteFill, Audio, Series, useVideoConfig } from "remotion";
import { ProgressBar } from "./ProgressBar";
import { CodeTransition } from "./CodeTransition";
import { HighlightedCode } from "codehike/code";
import { ThemeColors, ThemeProvider } from "./calculate-metadata/theme";
import { useEffect, useMemo, useState } from "react";
import { RefreshOnCodeChange } from "./ReloadOnCodeChange";
import { verticalPadding } from "./font";
import { getAudioWithStory } from "./calculate-metadata/get-files";

export type Props = {
  steps: HighlightedCode[] | null;
  themeColors: ThemeColors | null;
  codeWidth: number | null;
};

export const Main: React.FC<Props> = ({ steps, themeColors, codeWidth }) => {
  const [audios, setAudios] = useState<{
    audioSrc: string;
    videoDuration: number;
  }[]>([]);

  if (!steps) {
    throw new Error("Steps are not defined");
  }

  const data = useVideoConfig();
  const { durationInFrames } = data;
  console.log(data);

  const stepDuration = durationInFrames / steps.length;
  const transitionDuration = 30;

  if (!themeColors) {
    throw new Error("Theme colors are not defined");
  }

  const outerStyle: React.CSSProperties = useMemo(() => {
    return {
      backgroundColor: themeColors.background,
    };
  }, [themeColors]);

  const style: React.CSSProperties = useMemo(() => {
    return {
      padding: `${verticalPadding}px 0px`,
    };
  }, []);

  console.log("steps", steps);
  console.log("steps.length", steps.length);
  console.log("stepDuration", stepDuration);
  console.log("durationInFrames", durationInFrames);

  useEffect(() => {
    (async () => {
      const audioWithStory = await getAudioWithStory();
      setAudios(audioWithStory);
    })();
  }, []);

  console.log("audios", audios);

  return (
    <ThemeProvider themeColors={themeColors}>
      <AbsoluteFill style={outerStyle}>
        <AbsoluteFill
          style={{
            width: codeWidth || "100%",
            margin: "auto",
          }}
        >
          <ProgressBar steps={steps} />
          <AbsoluteFill style={style}>
            <Series>
              {steps.map((step, index) => {
                // Use fixed duration for debugging
                const sequenceDuration = stepDuration; // Remove audio-based duration for now

                console.log(`Sequence ${index}:`, {
                  sequenceDuration,
                  stepDuration,
                  stepMeta: step.meta || 'Unknown'
                });

                return (
                  <Series.Sequence
                    key={index}
                    layout="none"
                    durationInFrames={Math.floor(sequenceDuration)}
                    name={`Step ${index}: ${step.meta || 'Unknown'}`}
                  >
                    <CodeTransition
                      oldCode={steps[index - 1]} // Will be undefined for first step
                      newCode={step}
                      durationInFrames={transitionDuration}
                    />
                    
                    {audios[index]?.audioSrc && (
                      <Audio src={audios[index].audioSrc} />
                    )}
                  </Series.Sequence>
                );
              })}
            </Series>
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
      <RefreshOnCodeChange />
    </ThemeProvider>
  );
};