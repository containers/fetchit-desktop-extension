import React from "react";
import { Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { twMerge } from "tailwind-merge";

type MessageBoxProps = {
  msg: string;
  onClose: () => void;
  boxType: "error" | "success";
};

const MessageBox: React.FC<MessageBoxProps> = (props: MessageBoxProps) => {
  const { msg, onClose, boxType } = props;
  if (msg.length === 0) {
    return null;
  }
  const staticClassName = "px-2 min-w-full py-1 border-white border rounded-md";
  let colorModifier = "";
  switch (boxType) {
    case "error":
      colorModifier = "bg-red-500 text-white";
      break;
    case "success":
      colorModifier = "bg-green-500 text-white";
      break;
  }
  const finalClassName = twMerge(staticClassName, colorModifier);
  return (
    <Box className={finalClassName}>
      {/* <div className="flex flex-wrap justify-between">
        {boxType === "error" && <h1>Error:</h1>}
        <CloseIcon onClick={onClose} className="text-white cursor-pointer" />
      </div>
      <p>{msg}</p> */}
      <div className="flex  justify-between">
        <div className="pr-2">
          <h1>{boxType === "error" ? "Error:" : "Success:"}</h1>
          <p>{msg}</p>
        </div>
        <div className="text-black px-2 w-fit max-w-fit">
          <CloseIcon className="cursor-pointer text-white" onClick={onClose} />
        </div>
      </div>
    </Box>
  );
};
export default MessageBox;
