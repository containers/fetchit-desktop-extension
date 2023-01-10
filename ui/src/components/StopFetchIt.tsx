import React from "react";
import { LoadingButton } from "@mui/lab";
import {
  Modal,
  Box,
  FormControl,
  FormControlLabel,
  Checkbox,
  Button,
} from "@mui/material";
import { styles } from "../style";

type StopFetchItProps = {
  onStopClick: () => void;
  // onDeleteClick: () => void;
  isFetchItRunning: boolean;
  isFetchItShuttingDown: boolean;
  open: boolean;
  handleClose: () => void;
  handleOpen: () => void;
  includeCreatedContainers: boolean;
  onIncludeContainersChanged: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
};

const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "#27272a",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const StopFetchIt: React.FC<StopFetchItProps> = (props: StopFetchItProps) => {
  return (
    <div>
      <LoadingButton
        variant="contained"
        onClick={props.handleOpen}
        disabled={!props.isFetchItRunning}
        loading={props.isFetchItShuttingDown}
        className="bg-[#cb4d3e]"
        sx={{
          backgroundColor: "#cb4d3e",
        }}
      >
        Stop FetchIt
      </LoadingButton>
      <Modal open={props.open} onClose={props.handleClose}>
        <Box sx={style}>
          <h2
            id="fetchit-modal-title"
            className="text-white font-semibold text-xl"
          >
            Stop FetchIt
          </h2>
          <FormControl className="w-full">
            <FormControlLabel
              control={<Checkbox />}
              onChange={props.onIncludeContainersChanged}
              value={props.includeCreatedContainers}
              sx={{
                color: "#ffffff",
              }}
              label="Include created containers"
            />
          </FormControl>
          {/* <div className="flex "> */}
          <Button
            variant="contained"
            onClick={props.onStopClick}
            className="block mt-2"
            sx={{
              backgroundColor: "#cb4d3e",
              marginTop: "0.5rem",
            }}
          >
            Stop
          </Button>
          {/* <Button
              variant="contained"
              onClick={props.onDeleteClick}
              className="bg-[#cb4d3e]"
              sx={{
                backgroundColor: "#cb4d3e",
              }}
            >
              Delete
            </Button> */}
          {/* </div> */}
        </Box>
      </Modal>
    </div>
  );
};

export default StopFetchIt;
