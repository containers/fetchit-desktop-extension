import React, { useEffect, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";

// import { createDockerDesktopClient } from "@docker/extension-api-client";
import { v1 } from "@docker/extension-api-client-types";
import { Stack, Typography, Container } from "@mui/material";
import { load, dump } from "js-yaml";

import ContainerList from "./components/ContainerList";
import FetchItInput from "./components/FetchitInput";
import MessageBox from "./components/MessageBox";
import StatusIndicator from "./components/StatusIndicator";
import StopFetchIt from "./components/StopFetchIt";

import { colors, styles } from "./style";
import "./index.css";
import {
  type Container as ContainerResponse,
  type ContainerDetails,
  type FetchItConfigMethod,
} from "./types";

// Note: This line relies on Docker Desktop's presence as a host application.
// If you're running this React app in a browser, it won't work properly.
const FetchItContainerName = "podman-desktop-fetchit";
const FetchItConfigEnv = "FETCHIT_CONFIG";
const FetchItConfigURLEnv = "FETCHIT_CONFIG_URL";
const OwnedByLabel = "owned-by";
const OwnedByValue = "fetchit-podman-desktop";

// 60s
const PodmanAPIPollRate = 20000;

const getDockerDesktopClient = (): v1.DockerDesktopClient => {
  return window.ddClient as v1.DockerDesktopClient;
};

// const podmanMachineSocketsDirectoryMac = path.resolve(
//   os.homedir(),
//   ".local/share/containers/podman/machine",
// );

export function App() {
  const [podmanInfo, setPodmanInfo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [fetchItConfig, setFetchItConfig] = useState("");
  const [fetchItConfigURL, setFetchItConfigURL] = useState("");
  const [fetchItConfigType, setFetchItConfigType] =
    useState<FetchItConfigMethod>("url");
  const [stopModalOpen, setStopModalOpen] = useState(false);

  const [containers, setContainers] = useState<ContainerResponse[]>([]);
  // these states are used for performing the first initialization of FetchIt
  // in the event that the extension refreshes but a config exists
  const [timesContainersFetched, setTimesContainersFetched] = useState(0);
  const [fetchItNeedsConfig, setFetchItNeedsConfig] = useState(true);
  const [fetchItRunning, setFetchItRunning] = useState(false);
  const [fetchItContainerID, setFetchItContainerID] = useState("");
  const [fetchItShuttingDown, setFetchItShuttingDown] = useState(false);
  const [includeContainers, setIncludeContainers] = useState(false);

  const ddClient: v1.DockerDesktopClient = getDockerDesktopClient();

  const handleStopModalOpen = () => {
    // ensure that the modal always opens with this setting disabled
    setIncludeContainers(false);
    setStopModalOpen(true);
  };
  const handleStopModalClose = () => {
    setStopModalOpen(false);
  };

  const getFetchItImage = (): string => {
    const archDetected = ddClient.host.arch;
    const fetchItRepo = "quay.io/fetchit";
    const fetchItArm = `${fetchItRepo}/fetchit-arm`;
    const fetchItAmd = `${fetchItRepo}/fetchit-amd`;
    // this is the one where we just try it and see if it works
    const fetchItDefault = `${fetchItRepo}/fetchit`;
    switch (archDetected) {
      case "amd":
        return fetchItAmd;
      case "arm":
        return fetchItArm;
      case "arm64":
        return fetchItArm;
      default:
        return fetchItDefault;
    }
  };

  const updateDebugInfo = (s: string) => {
    const prevMessage = debugInfo;
    setDebugInfo(`${prevMessage}\n${s}`);
  };

  const fetchLatestContainers = async (): Promise<ContainerResponse[]> => {
    try {
      const latestContainers = (await ddClient.docker.listContainers({
        all: true,
      })) as ContainerResponse[];
      return latestContainers;
    } catch (e) {
      setError("could not fetch containers: " + e);
      return [];
    }
  };

  const getHostPodmanSocketPath = (): string => {
    switch (ddClient.host.platform) {
      case "linux":
        return "/run/user/1000/podman/podman.sock";
      // FIXME: figure out a way to obtain the socket path from the host machine, or at least the ${currentUser}
      case "darwin":
        // return "/Users/${currentUser}/.local/share/containers/podman/machine/podman-machine-default/podman.sock";
        throw new Error(
          "podman socket path is not currently accessible on MacOS",
        );
      default:
        // not supported
        throw new Error("current platform is not yet supported");
    }
  };

  /**
   *
   * @param config Config YAML for FetchIt
   * @param configURL URL to a FetchIt config
   * @returns environment variable to configure fetchit
   */
  const getFetchItConfig = (
    configMethod: FetchItConfigMethod,
    config: string,
    configURL: string,
  ): string => {
    // determine mode
    let fetchItConfigOpt: string;
    switch (configMethod) {
      case "manual":
        const serializedYaml = load(config);
        const normalizedYAML = dump(serializedYaml, {
          forceQuotes: true,
          quotingType: '"',
        });
        fetchItConfigOpt = `${FetchItConfigEnv}=${normalizedYAML}`;
        break;
      case "url":
        fetchItConfigOpt = `${FetchItConfigURLEnv}=${configURL}`;
        break;
      default:
        throw new Error("invalid input type being used");
    }
    return fetchItConfigOpt;
  };

  const shutDownFetchIt = async (
    containerName: string,
    ownedByLabel: string,
    ownedByLabelValue: string,
    includeCreatedContainers: boolean,
  ): Promise<boolean> => {
    const fetchItFilter = ["--filter", `name=${containerName}`];
    const fetchItContainersFilter = [
      "--filter",
      `label=${ownedByLabel}=${ownedByLabelValue}`,
    ];
    const containerFilters = [
      ...fetchItFilter,
      //  ...fetchItContainersFilter
    ];
    if (includeCreatedContainers) {
      containerFilters.push(...fetchItContainersFilter);
    }
    const timeArg = ["--time", "2"];
    setFetchItShuttingDown(true);
    try {
      const stopResult = await ddClient.docker.cli.exec("container", [
        "stop",
        ...containerFilters,
        ...timeArg,
      ]);
      if (stopResult.stderr) {
        setError(
          `received error from podman daemon while shutting down FetchIt: ${stopResult.stderr}`,
        );
        // return false;
      } else {
        updateDebugInfo(stopResult.stdout);
        updateDebugInfo("");
      }
      const rmResult = await ddClient.docker.cli.exec("container", [
        "rm",
        ...containerFilters,
        "--force",
        ...timeArg,
      ]);
      if (rmResult.stderr) {
        setError(`could not delete containers: ${rmResult.stderr}`);
        // return false;
      } else {
        updateDebugInfo(rmResult.stdout);
      }
    } catch (e) {
      setError(`error calling the podman cli: ${e}`);
      return false;
    } finally {
      setFetchItShuttingDown(false);
    }
    updateDebugInfo("successfully stopped & removed fetchit container");
    return true;
  };

  //  FIXME: this function causes a high CPU load
  const launchFetchIt = async (
    config: string,
    configURL: string,
    fetchItIsRunning: boolean,
  ) => {
    updateDebugInfo("launching docker cli");
    const fetchItImage = getFetchItImage();
    // normalize yaml so it's safe to load as an environment variable
    updateDebugInfo("using fetchit image: " + fetchItImage);
    const fetchItConfigOpt = getFetchItConfig(
      fetchItConfigType,
      config,
      configURL,
    );
    updateDebugInfo(
      "passing in the following config argument:\n" + fetchItConfigOpt,
    );
    // FIXME: grab platform information from ddClient
    // currently this relies on issue:https://github.com/containers/podman-desktop/issues/986
    let socketPath: string;
    try {
      socketPath = getHostPodmanSocketPath();
    } catch (e) {
      setError("could not get podman socket: " + e);
      return;
    }
    const fetchItPodmanSocket = `${socketPath}:/run/podman/podman.sock`;
    try {
      // shut down the currently running instance if it exists
      if (fetchItIsRunning) {
        const shouldContinue = await shutDownFetchIt(
          FetchItContainerName,
          OwnedByLabel,
          OwnedByValue,
          false,
        );
        if (!shouldContinue) {
          // debug
          updateDebugInfo(`received signal to not continue`);
          // normal mode
          return;
        }
      }
      await ddClient.docker.cli
        .exec("run", [
          "-d",
          "--name",
          FetchItContainerName,
          "-v",
          "fetchit-volume:/opt",
          "-e",
          fetchItConfigOpt,
          "--label",
          `${OwnedByLabel}=${OwnedByValue}`,
          "-v",
          fetchItPodmanSocket,
          "--security-opt",
          "label=disable",
          fetchItImage,
        ])
        .then((r) => {
          updateDebugInfo("got response back from podman");
          if (r.stderr !== "") {
            setError(r.stderr);
          } else {
            setPodmanInfo(r.stdout);
            setSuccess(
              `Created FetchIt container '${FetchItContainerName}' 🚀🌕`,
            );
          }
        })
        .catch((e) => {
          // ddClient.desktopUI.toast.error("failed to launch fetchit");
          setError("got an error when calling docker cli:" + e);
        });
    } catch (e) {
      setError("uh oh, we've reached an error condition: " + e);
    }
  };

  // this effect only runs fully once, returns otherwise
  useEffect(() => {
    // not a valid state for initializaiton
    if (timesContainersFetched !== 1 || !fetchItNeedsConfig) {
      return;
    }
    // user has already entered their own data here
    if (fetchItConfig !== "") {
      return;
    }
    // there may exist a running fetchit container here so we want to grab its config
    const filteredContainers = containers.filter((c) => {
      for (let i = 0; i < c.Names.length; i++) {
        if (c.Names[i].includes(FetchItContainerName)) {
          return true;
        }
      }
      return false;
    });
    // no fetchit found
    if (filteredContainers.length === 0) {
      setFetchItNeedsConfig(false);
      return;
    }
    // fetchit exists, pull config and init
    ddClient.docker.cli
      .exec("inspect", [FetchItContainerName])
      .then((r) => {
        if (r.stderr !== "") {
          setError(`could not load existing FetchIt config: ${r.stderr}'`);
          return;
        }
        const containerList = JSON.parse(r.stdout) as ContainerDetails[];
        if (
          typeof containerList === "undefined" ||
          containerList.length === 0
        ) {
          return;
        }
        // extract config from command
        const fetchitDetails = containerList.pop();
        if (!fetchitDetails.Config) {
          return;
        }

        fetchitDetails.Config.Env.forEach((e) => {
          const [envName, value] = e.split("=");
          if (envName === FetchItConfigEnv) {
            const serializedConfig = load(value);
            const normalizedConfig = dump(serializedConfig, {
              forceQuotes: true,
              quotingType: '"',
              sortKeys: true,
            });
            setFetchItConfigType("manual");
            setFetchItConfig(normalizedConfig);
            return;
          }
          if (envName === FetchItConfigURLEnv) {
            setFetchItConfigType("url");
            setFetchItConfigURL(value);
            return;
          }
        });
      })
      .catch((e) => setError("could not inspect fetchit container: " + e));
    setFetchItNeedsConfig(false);
  }, [timesContainersFetched]);

  // fetches the containers everytime
  useEffect(() => {
    const updateContainerList = async () => {
      const latestContainers = await fetchLatestContainers();
      setContainers(latestContainers);
      setTimesContainersFetched(timesContainersFetched + 1);
    };
    // run once on start
    updateContainerList();
    const interval = setInterval(updateContainerList, PodmanAPIPollRate);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchItContainer = containers.find((c) => {
      const containerName = c.Names.find((n) =>
        n.includes(FetchItContainerName),
      );
      return typeof containerName !== "undefined";
    });
    if (
      typeof fetchItContainer !== "undefined" &&
      fetchItContainerID !== fetchItContainer.Id
    ) {
      setFetchItContainerID(fetchItContainer.Id);
    }
    setFetchItRunning(
      typeof fetchItContainer !== "undefined" &&
        fetchItContainer.State === "running",
    );
  }, [containers, fetchItContainerID]);

  const fetchItContainers = containers.filter((c) => {
    const fetchItLabel = c.Labels["owned-by"];
    return typeof fetchItLabel !== "undefined" && fetchItLabel === "fetchit";
  });

  const handleFetchItConfigTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const targetValue = e.target.value as FetchItConfigMethod;
    setFetchItConfigType(targetValue);
  };

  const handleFetchItConfigURLChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    setFetchItConfigURL(e.target.value);
  };

  const handleIncludeContainersChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setIncludeContainers(event.target.checked);
  };

  const handleStopFetchIt = () => {
    shutDownFetchIt(
      FetchItContainerName,
      OwnedByLabel,
      OwnedByValue,
      includeContainers,
    );
    setStopModalOpen(false);
  };
  return (
    <Container
      style={{
        backgroundColor: colors.backgroundPrimary,
      }}
    >
      <h1 className="mt-4 text-4xl text-white font-semibold">FetchIt</h1>
      <div className="mt-4 text-slate-200">
        Please provide a configuration for your FetchIt instance:
      </div>
      <div
        className="text-[#b88fff] min-w-full cursor-pointer hover:text-[#c5a5fc] "
        onClick={() =>
          ddClient.host.openExternal(
            "https://fetchit.readthedocs.io/en/latest/methods.html",
          )
        }
      >
        Read about FetchIt Configuration
      </div>

      {/* {ready && ( */}

      <Stack direction="column" alignItems="start" spacing={2} sx={{ mt: 2 }}>
        <FetchItInput
          codeAreaValue={fetchItConfig}
          onCodeAreaChange={(e) => setFetchItConfig(e.target.value)}
          fetchItConfigType={fetchItConfigType}
          onFetchItConfigTypeChange={handleFetchItConfigTypeChange}
          fetchItConfigURL={fetchItConfigURL}
          onURLChange={handleFetchItConfigURLChange}
          disabled={timesContainersFetched < 1}
        />
        <LoadingButton
          onClick={() =>
            launchFetchIt(fetchItConfig, fetchItConfigURL, fetchItRunning)
          }
          sx={{
            mt: 2,
            backgroundColor: colors.buttonPrimary,
          }}
          variant="contained"
          loading={timesContainersFetched < 1}
        >
          Submit
        </LoadingButton>
        {/* FIXME: turn this into a queue where messages are pushed and deleted after X seconds or deletion */}
        <MessageBox
          msg={success}
          boxType="success"
          onClose={() => setSuccess("")}
        />
        <MessageBox msg={error} boxType="error" onClose={() => setError("")} />
        {/* {podmanInfo !== "" && (
          <Box style={styles.box}>
            <Info text={podmanInfo} />
          </Box>
        )} */}
        {/* {debugInfo !== "" && (
          <Box style={styles.box}>
            <Info text={debugInfo} />
          </Box>
        )} */}
        <div className="min-w-full border-t-[#8c4afd] border-t pt-4" />
        <StatusIndicator isRunning={fetchItRunning} />
        {/* <LoadingButton
          variant="contained"
          onClick={() => {
            shutDownFetchIt(FetchItContainerName, OwnedByLabel, OwnedByValue);
          }}
          disabled={!fetchItRunning}
          loading={fetchItShuttingDown}
          className="bg-[#cb4d3e]"
          sx={{
            backgroundColor: "#cb4d3e",
          }}
        >
          Stop FetchIt
        </LoadingButton> */}
        <StopFetchIt
          handleClose={handleStopModalClose}
          handleOpen={handleStopModalOpen}
          open={stopModalOpen}
          isFetchItRunning={fetchItRunning}
          isFetchItShuttingDown={fetchItShuttingDown}
          onIncludeContainersChanged={handleIncludeContainersChange}
          includeCreatedContainers={includeContainers}
          onStopClick={handleStopFetchIt}
        />
        <Typography variant="h6" style={styles.typeographyPrimary}>
          Created Containers
        </Typography>
        <ContainerList containers={fetchItContainers} />
      </Stack>
      {/* <TextField>{windowState}</TextField> */}
    </Container>
  );
}
