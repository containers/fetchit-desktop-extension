import React from "react";
import { Typography } from "@mui/material";
type DisplayProps = {
  text: string;
};

const Log: React.FC<DisplayProps> = (props: DisplayProps) => {
  return (
    <Typography
      variant="body1"
      style={{
        color: "#f7f7f7",
      }}
      sx={{ mt: 2 }}
    >
      {props.text}
    </Typography>
  );
};
export default Log;
