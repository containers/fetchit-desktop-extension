import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
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
import { load, dump } from "js-yaml";
import ContainerList from "./components/ContainerList";
import { colors, styles } from "./style";
import { OpenDialogResult } from "@docker/extension-api-client-types/dist/v1/dialog";
import FetchItInput from "./components/FetchitInput";
import { isNativeError } from "util/types";

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

export function App() {
  const [podmanInfo, setPodmanInfo] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [ready, setReady] = useState(false);
  const [fetchItConfig, setFetchItConfig] = useState("");
  const [fetchItConfigURL, setFetchItConfigURL] = useState("");
  const [fetchItConfigType, setFetchItConfigType] =
    useState<FetchItConfigMethod>("manual");
  const [knownArch, setKnownArch] = useState("");
  const [containers, setContainers] = useState<ContainerResponse[]>([]);
  // these states are used for performing the first initialization of FetchIt
  // in the event that the extension refreshes but a config exists
  const [timesContainersFetched, setTimesContainersFetched] = useState(0);
  const [fetchItNeedsConfig, setFetchItNeedsConfig] = useState(true);
  const ddClient: v1.DockerDesktopClient = getDockerDesktopClient();

  const getFetchItImage = (): string => {
    const archDetected = ddClient.host.arch;
    const fetchItRepo = "quay.io/fetchit";
    const fetchItArm = `${fetchItRepo}/fetchit-arm`;
    const fetchItAmd = `${fetchItRepo}/fetchit-amd`;
    // this is the one where we just try it and see if it works
    const fetchItDefault = `${fetchItRepo}/fetchit-arm`;
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
      const containers = (await ddClient.docker.listContainers({
        all: true,
      })) as ContainerResponse[];
      return containers;
    } catch (e) {
      setDebugInfo("could not fetch containers: " + e);
      return [];
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
      setDebugInfo("could not list containers: " + e);
      return [];
    }
  };

  /**
   *
   * @param config Config YAML for FetchIt
   * @param configURL URL to a FetchIt config
   * @returns environment variable to configure fetchit
   */
  const getFetchItConfig = (config: string, configURL: string): string => {
    // determine mode
    let fetchItConfigOpt: string;
    switch (fetchItConfigType) {
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
    const fetchItConfigOpt = getFetchItConfig(config, configURL);
    updateDebugInfo(
      "passing in the following config argument:\n" + fetchItConfigOpt,
    );

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
          "/run/user/1000/podman/podman.sock:/run/podman/podman.sock",
          "--security-opt",
          "label=disable",
          fetchItImage,
        ])
        .then((r) => {
          setDebugInfo("got response back from podman");
          if (r.stderr !== "") {
            setPodmanInfo(r.stderr);
          } else {
            setPodmanInfo(r.stdout);
            // ddClient.desktopUI.toast.success("created fetchit container");
          }
        })
        .catch((e) => {
          // ddClient.desktopUI.toast.error("failed to launch fetchit");
          setDebugInfo("got an error when calling docker cli:" + e);
        });
      setDebugInfo("done calling the docker cli");
    } catch (e) {
      setDebugInfo("uh oh, we've reached an error condition: " + e);
    }
  };
  const getImages = async () => {
    // await ddClient.docker.listImages().then((r) => console.log("images:", r));
    await ddClient.docker.cli
      .exec("image", ["list"])
      .then((r) => console.log("got result:"));
  };

  //  TODO: use this once host information is exposed
  // initialization hook
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const dockerClient = window.ddClient as v1.DockerDesktopClient;
      if (dockerClient.host.arch !== "") {
        setKnownArch(ddClient.host.arch);
        setReady(true);
      }
    }, 200);
    if (ready) {
      clearInterval(checkInterval);
    }
  }, [ready]);

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
        if (typeof extractedConfigEnv === "undefined") {
          return;
        }
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
        setFetchItConfig(normalizedConfig);
      })
      .catch((e) => setDebugInfo("could not inspect fetchit container: " + e));
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

  //  TODO: make this work once host information is available within ddClient
  // const [arch, setArch] = useState("");
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const ddClient: v1.DockerDesktopClient =
  //       window.ddClient as v1.DockerDesktopClient;
  //     if (typeof ddClient === "undefined") {
  //       setArch("arch not ready yet");
  //       return;
  //     }
  //     if (typeof ddClient.host === "undefined") {
  //       setArch("docker client exists but arch is not ready yet");
  //       return;
  //     }
  //     if (ddClient.host.arch === "") {
  //       setArch("host exists but arch is not available");
  //       return;
  //     }
  //     setArch(ddClient.host.arch);
  //   }, 500);
  //   return () => clearInterval(interval);
  // }, []);

  // try {
  //   // const ddClient = createDockerDesktopClient();
  //   // const platformInfo = window.platformInfo;
  // } catch (e) {
  //   return (
  //     <Container
  //       style={{
  //         backgroundColor: colors.backgroundPrimary,
  //       }}
  //     >
  //       <Typography variant="h2" style={styles.typeographyPrimary}>
  //         Could not create ddclient: {e}
  //       </Typography>
  //     </Container>
  //   );
  // }
  // return (
  //   <Container
  //     style={{
  //       backgroundColor: colors.backgroundPrimary,
  //     }}
  //   >
  //     <Typography variant="h2" style={styles.typeographyPrimary}>
  //       detected arch: {arch}
  //     </Typography>
  //   </Container>
  // );

  // try {
  //   // const ddClient = createDockerDesktopClient();
  // } catch (e) {
  //   return (
  //     <Container
  //       style={{
  //         backgroundColor: colors.backgroundPrimary,
  //       }}
  //     >
  //       <Typography variant="h2" style={styles.typeographyPrimary}>
  //         Could not create ddClient: {e}
  //       </Typography>
  //     </Container>
  //   );
  // } finally {
  //   <Container
  //     style={{
  //       backgroundColor: colors.backgroundPrimary,
  //     }}
  //   >
  //     <Typography variant="h2" style={styles.typeographyPrimary}>
  //       Successfully created the docker desktop client
  //     </Typography>
  //   </Container>;
  // }

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
        {/* {ready ? (
          <Info
            text={`FetchIt is ready, using image: ${getFetchItImage()} since we detected architecture: ${
              ddClient.host.arch
            }`}
          />
        ) : (
          <Info text="FetchIt is still loading, waiting for host architecture to be known" />
        )} */}
        <FetchItInput
          codeAreaValue={fetchItConfig}
          onCodeAreaChange={(e) => setFetchItConfig(e.target.value)}
          fetchItConfigType={fetchItConfigType}
          onFetchItConfigTypeChange={handleFetchItConfigTypeChange}
          fetchItConfigURL={fetchItConfigURL}
          onURLChange={handleFetchItConfigURLChange}
        />
        {debugInfo !== "" && (
          <Box style={styles.box}>
            <Info text={debugInfo} />
          </Box>
        )}
        {podmanInfo !== "" && (
          <Box style={styles.box}>
            <Info text={podmanInfo} />
          </Box>
        )}
        <Button
          onClick={() => launchFetchIt(fetchItConfig, fetchItConfigURL)}
          sx={{
            mt: 2,
            backgroundColor: colors.buttonPrimary,
          }}
          variant="contained"
          // style={styles.box}
        >
          Submit
        </Button>
        <Typography variant="h2" style={styles.typeographyPrimary}>
          Running Containers
        </Typography>
        <ContainerList containers={fetchItContainers} />
      </Stack>
      {/* )} */}
      {/* <TextField>{windowState}</TextField> */}
    </Container>
  );
}
