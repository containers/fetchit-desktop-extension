import React from "react";

export const colors = {
  backgroundPrimary: "#27272a",
  backgroundSecondary: "#18181b",
  buttonPrimary: "#8c4afd",
  textPrimary: "#eaeaeb",
  textSecondary: "#f7f7f7",
  violet400: "rgb(167 139 250)",
  borderColor: "#535867",
  black: "rgb(0 0 0)",
} as const;

type ColorMap = {
  [name: string]: React.CSSProperties;
};

const containerPaddingX = 8;
const containerPaddingY = 4;
export const styles: ColorMap = {
  codeEditor: {
    minWidth: "100%",
    backgroundColor: colors.backgroundSecondary,
    fontSize: 16,
    minHeight: "160px",
    height: "fit-content",
    borderColor: "#535867",
    borderWidth: "1px",
    borderRadius: "0.25rem",
    fontFamily:
      "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
  },
  box: {
    borderColor: colors.black,
    borderWidth: "1px",
    borderRadius: "0.25rem",
    backgroundColor: colors.backgroundSecondary,
    paddingLeft: containerPaddingX,
    paddingRight: containerPaddingX,
    paddingTop: containerPaddingY,
    paddingBottom: containerPaddingY,
    minWidth: "100%",
  },
  typeographyPrimary: {
    color: colors.textPrimary,
  },
  typeographySecondary: {
    color: colors.textSecondary,
  },
  buttonPrimary: {
    backgroundColor: colors.buttonPrimary,
  },
} as const;
