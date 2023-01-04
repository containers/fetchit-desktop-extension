import React from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UnpublishedIcon from "@mui/icons-material/Unpublished";

type StatusIndicatorProps = {
  isRunning: boolean;
};

const StatusIndicator: React.FC<StatusIndicatorProps> = (
  props: StatusIndicatorProps,
) => {
  const { isRunning } = props;
  return (
    <div className="w-fit rounded-lg bg-zinc-900 px-2 py-1">
      {isRunning ? (
        <div className="flex flex-auto gap-2">
          <CheckCircleIcon htmlColor="#64ad6c" />
          <div className="text-white">FetchIt is running</div>
        </div>
      ) : (
        <div className="flex flex-auto gap-2">
          <UnpublishedIcon />
          <div className="text-white">FetchIt is not running</div>
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;
