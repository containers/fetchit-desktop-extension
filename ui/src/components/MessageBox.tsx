import { Box, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { twMerge } from "tailwind-merge";

type MessageBoxProps = {
  msg: string;
  onClose: () => void;
  boxType: "error" | "success";
};

const MessageBox = (props: MessageBoxProps) => {
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
      <div className="flex flex-wrap justify-between">
        <h1>Error:</h1>
        <CloseIcon onClick={onClose} className="text-white cursor-pointer" />
      </div>
      <Typography>{msg}</Typography>
    </Box>
  );
};
export default MessageBox;
