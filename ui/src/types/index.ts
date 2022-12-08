export type Container = {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Ports: ContainerPort[];
  Labels: {
    [key: string]: string;
  };
  HostConfig: NetworkConfig;
  State: string;
  Status: string;
  NetworkSettings: ContainerNetworkSettings;
  Mounts: string[];
  SizeRootFS: number;
  SizeRw: number;
};

export type ContainerError = {
  message: string;
};

export type ContainerPort = {
  PublicPort?: number;
  PrivatePort: number;
  Type: "udp" | "tcp";
};

export type NetworkConfig = {
  NetworkMode: string;
};

export type ContainerNetworkSettings = {
  Networks: {
    [key: string]: EndpointSettings;
  };
};

export type EndpointSettings = {
  Links: string[] | null;
  Aliases: string[] | null;
  NetworkID: string;
  EndpointID: string;
  Gateway: string;
  IPAddress: string;
  IPPrefixLen: number;
  IPv6Gateway: string;
  GlobalIPv6PrefixLen: number;
  MacAddress: string;
  DriverOpts: {
    [key: string]: string;
  } | null;
  IPAMConfig: EndpointIPAMConfig | null;
};

export type EndpointIPAMConfig = {
  IPv4Address: string;
  IPv6Address: string;
  LinkLocalIPs: string[];
};

export type ContainerConfig = {
  // Hostname: string;
  // Domainname: string;
  // User: string;
  // AttachStdin: boolean;
  // AttachStdout: boolean;
  // AttachStderr: boolean;
  // Tty: boolean;
  // OpenStdin: boolean;
  // StdinOnce: boolean;
  Env: string[];
  // Cmd: string[];
  // Image: string;
  // stuff we don't care about
  [_: string]: any;
};

export type ContainerDetails = {
  // exclude fields that we do not care about
  [key: string]: any;
  Config?: ContainerConfig;
} & Container;
