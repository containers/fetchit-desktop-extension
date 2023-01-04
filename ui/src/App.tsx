import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import LoadingButton from "@mui/lab/LoadingButton";

// import { createDockerDesktopClient } from "@docker/extension-api-client";
import { v1 } from "@docker/extension-api-client-types";
import {
  Stack,
  TextField,
  Typography,
  Container,
  Box,
  Backdrop,
} from "@mui/material";
import CodeTextArea from "@uiw/react-textarea-code-editor";
import Info from "./Log";
import type {
  Container as ContainerResponse,
  ContainerDetails,
  FetchItConfigMethod,
} from "./types";
import { PlatformInfo } from "./types";
import { load, dump } from "js-yaml";
import ContainerList from "./components/ContainerList";
import { colors, styles } from "./style";
import { OpenDialogResult } from "@docker/extension-api-client-types/dist/v1/dialog";
import FetchItInput from "./components/FetchitInput";
import { isNativeError } from "util/types";
import "./index.css";
import MessageBox from "./components/MessageBox";
import StatusIndicator from "./components/StatusIndicator";

// Note: This line relies on Docker Desktop's presence as a host application.
// If you're running this React app in a browser, it won't work properly.
const FetchItContainerName = "podman-desktop-fetchit";
const FetchItConfigEnv = "FETCHIT_CONFIG";
const FetchItConfigURLEnv = "FETCHIT_CONFIG_URL";
const OwnedByLabel = "owned-by";
const OwnedByValue = "fetchit-podman-desktop";

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
  const [containers, setContainers] = useState<ContainerResponse[]>([]);
  // these states are used for performing the first initialization of FetchIt
  // in the event that the extension refreshes but a config exists
  const [timesContainersFetched, setTimesContainersFetched] = useState(0);
  const [fetchItNeedsConfig, setFetchItNeedsConfig] = useState(true);
  const [fetchItRunning, setFetchItRunning] = useState(false);
  const ddClient: v1.DockerDesktopClient = getDockerDesktopClient();

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

  // FIXME: have th
  const getHostPodmanSocketPath = (): string => {
    switch (ddClient.host.platform) {
      case "linux":
        return "/run/user/1000/podman/podman.sock";
      case "darwin":
        // FIXME: get this information programatically
        return "/Users/osilkin/.local/share/containers/podman/machine/podman-machine-default/podman.sock";
      default:
        // not supported
        throw new Error("current platform is not yet supported");
    }
  };
  const getFetchItContainers = async (): Promise<ContainerResponse[]> => {
    try {
      const myContainers =
        (await ddClient.docker.listContainers()) as ContainerResponse[];
      const fetchItContainers = myContainers.filter((v) => {
        const fetchitLabel = v.Labels["owned-by"];
        return (
          typeof fetchitLabel !== "undefined" && fetchitLabel === "fetchit"
        );
      });
      return fetchItContainers;
    } catch (e) {
      setError("could not list containers: " + e);
      return [];
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

  const launchFetchIt = async (config: string, configURL: string) => {
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
          setDebugInfo("got response back from podman");
          if (r.stderr !== "") {
            setError(r.stderr);
          } else {
            setPodmanInfo(r.stdout);
            setSuccess(
              "Successfully started FetchIt container 🚀🌕 '" +
                FetchItContainerName +
                "'",
            );
            // ddClient.desktopUI.toast.success("created fetchit container");
          }
        })
        .catch((e) => {
          // ddClient.desktopUI.toast.error("failed to launch fetchit");
          setError("got an error when calling docker cli:" + e);
        });
      setDebugInfo("done calling the docker cli");
    } catch (e) {
      setError("uh oh, we've reached an error condition: " + e);
    }
  };

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

        const extractedConfigEnv = fetchitDetails.Config.Env.find((e) =>
          e.startsWith(FetchItConfigEnv),
        );
        const extractedConfigURLEnv = fetchitDetails.Config.Env.find((e) =>
          e.startsWith(FetchItConfigURLEnv),
        );

        if (typeof extractedConfigEnv !== "undefined") {
          // strip out "CONFIG_NAME=" so only raw yaml is left
          const rawConfig = extractedConfigEnv.substring(
            FetchItConfigEnv.length + 1,
          );
          const serializedConfig = load(rawConfig);
          const normalizedConfig = dump(serializedConfig, {
            forceQuotes: true,
            quotingType: '"',
            sortKeys: true,
          });
          setFetchItConfigType("manual");
          setFetchItConfig(normalizedConfig);
          return;
        }
        if (typeof extractedConfigURLEnv !== "undefined") {
          const configURL = extractedConfigURLEnv.substring(
            FetchItConfigURLEnv.length + 1,
          );
          setFetchItConfigType("url");
          setFetchItConfigURL(configURL);
          return;
        }
      })
      .catch((e) => setError("could not inspect fetchit container: " + e));
    setFetchItNeedsConfig(false);
  }, [timesContainersFetched]);

  useEffect(() => {
    const interval = setInterval(async () => {
      // filter out the fetchit containers
      const latestContainers = await fetchLatestContainers();
      setContainers(latestContainers);
      setTimesContainersFetched(timesContainersFetched + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchItContainer = containers.find((c) => {
      const containerName = c.Names.find((n) =>
        n.includes(FetchItContainerName),
      );
      return typeof containerName !== "undefined";
    });
    setFetchItRunning(typeof fetchItContainer !== "undefined");
  }, [containers]);

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

  return (
    <Container
      style={{
        backgroundColor: colors.backgroundPrimary,
      }}
    >
      <Typography variant="h1" style={styles.typeographyPrimary}>
        FetchIt
      </Typography>
      <Typography
        variant="body1"
        style={styles.typeographySecondary}
        sx={{ mt: 2 }}
      >
        Please provide a configuration for your FetchIt instance:
      </Typography>
      {/* {ready && ( */}

      <Stack direction="column" alignItems="start" spacing={2} sx={{ mt: 4 }}>
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
          onClick={() => launchFetchIt(fetchItConfig, fetchItConfigURL)}
          sx={{
            mt: 2,
            backgroundColor: colors.buttonPrimary,
          }}
          variant="contained"
          loading={timesContainersFetched < 1}
        >
          Submit
        </LoadingButton>
        <MessageBox
          msg={success}
          boxType="success"
          onClose={() => setSuccess("")}
        />
        <MessageBox msg={error} boxType="error" onClose={() => setError("")} />
        {podmanInfo !== "" && (
          <Box style={styles.box}>
            <Info text={podmanInfo} />
          </Box>
        )}
        <div className="min-w-full border-t-[#8c4afd] border-t pt-4"></div>
        <StatusIndicator isRunning={fetchItRunning} />
        <Typography variant="h6" style={styles.typeographyPrimary}>
          Running Containers
        </Typography>
        <ContainerList containers={fetchItContainers} />
      </Stack>
      {/* <TextField>{windowState}</TextField> */}
    </Container>
  );
}
