import {
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Box,
  Typography,
} from "@mui/material";
import ListItemIcon from "@mui/material/ListItemIcon";
import DvrIcon from "@mui/icons-material/Dvr";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { Container } from "../types";
import { colors } from "../style";

import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { VpnLock } from "@mui/icons-material";

type ContainerListProps = {
  containers: Container[];
};

const columns: GridColDef[] = [
  {
    field: "containerName",
    headerName: "Name",
    width: 200,
    valueGetter: (params: GridValueGetterParams) => {
      const c = params.row as Container;
      return c.Names[0].substring(1);
    },
  },
  {
    field: "Status",
    headerName: "Status",
    width: 100,
    sortable: true,
    description: "The status of the given containers.",
  },
  {
    field: "State",
    headerName: "State",
    width: 100,
    sortable: true,
    description: "What state the given containers are in.",
  },
  {
    field: "Image",
    headerName: "Image",
    width: 150,
    sortable: true,
    description: "The images being pulled by the given containers.",
  },
  {
    field: "Created",
    headerName: "Created",
    width: 120,
    sortable: true,
    description: "When the given containers were created.",
    valueGetter: (params: GridValueGetterParams) => {
      const c = params.row as Container;
      const date = new Date(c.Created * 1000);
      return `${date.toLocaleDateString("en-US")} ${date.toLocaleTimeString(
        "en-US",
      )}`;
    },
  },
];

const testContainers: (Container & { id: any })[] = [
  {
    id: 2345,
    Command: "test.sh",
    Created: 123456,
    HostConfig: {
      NetworkMode: "private",
    },
    Id: "1234",
    Image: "hello-world",
    ImageID: "wewewe",
    Labels: {
      testLabel: "testValue",
    },
    Mounts: ["mount1", "mount2"],
    Names: ["hello", "world"],
    NetworkSettings: {
      Networks: {
        "my-network": {
          Aliases: ["kendrick"],
          DriverOpts: {
            option1: "option2",
          },
          EndpointID: "23",
          Gateway: "my-taxes",
          GlobalIPv6PrefixLen: 123,
          IPAddress: "1.2.3.4",
          IPAMConfig: {
            IPv4Address: "/ip4/tcp/127.0.0.1",
            IPv6Address: ":::",
            LinkLocalIPs: ["1", "2"],
          },
          IPPrefixLen: 23,
          IPv6Gateway: "my.gateway",
          Links: ["1"],
          MacAddress: "1,2.2342341234123",
          NetworkID: "hello",
        },
      },
    },
    Ports: [
      {
        PrivatePort: 1234,
        Type: "tcp",
      },
    ],
    SizeRootFS: 123,
    SizeRw: 23,
    State: "started",
    Status: "stopped",
  },
  {
    id: 3452,
    Command: "test.sh",
    Created: 123456,
    HostConfig: {
      NetworkMode: "private",
    },
    Id: "1234",
    Image: "hello-world",
    ImageID: "wewewe",
    Labels: {
      testLabel: "testValue",
    },
    Mounts: ["mount1", "mount2"],
    Names: ["hello", "world"],
    NetworkSettings: {
      Networks: {
        "my-network": {
          Aliases: ["kendrick"],
          DriverOpts: {
            option1: "option2",
          },
          EndpointID: "23",
          Gateway: "my-taxes",
          GlobalIPv6PrefixLen: 123,
          IPAddress: "1.2.3.4",
          IPAMConfig: {
            IPv4Address: "/ip4/tcp/127.0.0.1",
            IPv6Address: ":::",
            LinkLocalIPs: ["1", "2"],
          },
          IPPrefixLen: 23,
          IPv6Gateway: "my.gateway",
          Links: ["1"],
          MacAddress: "1,2.2342341234123",
          NetworkID: "hello",
        },
      },
    },
    Ports: [
      {
        PrivatePort: 1234,
        Type: "tcp",
      },
    ],
    SizeRootFS: 123,
    SizeRw: 23,
    State: "started",
    Status: "stopped",
  },
];

// const ContainerList = (props: ContainerListProps) => {
//   const { containers } = props;
//   return (
//     <Box
//       sx={{
//         width: "100%",
//         height: 400,
//         backgroundColor: colors.backgroundSecondary,
//       }}
//     >
//       <DataGrid
//         rows={testContainers}
//         columns={columns}
//         pageSize={5}
//         rowsPerPageOptions={[5]}
//         sx={{
//           color: colors.textSecondary,
//           "&:hover": {
//             color: "#000000",
//           },
//         }}
//       />
//       {/* <List
//         // sx={{
//         //   width: "100%",
//         // }}
//         component="nav"
//         aria-labelledby="nested-list-subheader"
//         subheader={
//           <ListSubheader
//             color="primary"
//             component="div"
//             id="nested-list-subheader"
//           >
//             <Typography
//               sx={{
//                 color: colors.textPrimary,
//                 backgroundColor: colors.backgroundSecondary,
//               }}
//             >
//               Running FetchIt Containers
//             </Typography>
//           </ListSubheader>
//         }
//       >
//         {containers.map((c) => (
//           <ListItemButton>
//             <ListItemIcon>
//               <DvrIcon
//                 sx={{
//                   fill: colors.textSecondary,
//                 }}
//               />
//             </ListItemIcon>
//             <ListItemText
//               sx={{
//                 color: colors.textSecondary,
//                 "&:hover": {
//                   color: colors.violet400,
//                 },
//               }}
//               primary={c.Names[0].replace("/", "")}
//             />
//           </ListItemButton>
//         ))}
//       </List> */}
//     </Box>
//   );
// };

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const ContainerList = (props: ContainerListProps) => {
  const { containers } = props;
  return (
    <div className="min-w-full flex" slot="table">
      <table className="w-full">
        <thead>
          <tr className="h-7 uppercase text-xs text-gray-300">
            <th className="text-left">Name</th>
            <th className="text-left">Image</th>
            <th className="text-left">Status</th>
          </tr>
        </thead>
        <tbody className="text-gray-200">
          {testContainers.map((v, i) => (
            <>
              <tr
                key={2 * i}
                className="group w-full my-2 min-w-full h-12 bg-zinc-900 hover:bg-zinc-700 rounded-xl mx-4"
              >
                {/* <td className="whitespace-nowrap hover:cursor-pointer group">
                  <div className="flex items-center text-sm text-gray-200 group-hover:text-violet-400">
                    {v.Names[0].substring(1)}
                  </div>
                </td> */}
                <td className="whitespace-nowrap mx-auto hover:cursor-pointer group group-hover:text-violet-400">
                  <div className="flex items-center">
                    {v.Names[0].substring(1)}
                  </div>
                </td>
                <td className="whitespace-nowrap hover:cursor-pointer group group-hover:text-violet-400">
                  <div className="flex items-center mx-auto">{v.Image}</div>
                </td>
                <td className="whitespace-nowrap hover:cursor-pointer group group-hover:text-violet-400">
                  <div className="flex items-center mx-auto">{v.Status}</div>
                </td>
              </tr>
              <tr key={2 * i + 1}>
                <td className="leading-[8px]">&nbsp;</td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </div>
    // <TableContainer component={Paper}>
    //   <Table sx={{ minWidth: 700 }} aria-label="customized table">
    //     <TableHead>
    //       <TableRow>
    //         <StyledTableCell align="right">Name</StyledTableCell>
    //         <StyledTableCell align="right">Image</StyledTableCell>
    //         <StyledTableCell align="right">Status</StyledTableCell>
    //         <StyledTableCell align="right">State</StyledTableCell>
    //         <StyledTableCell align="right">Created At</StyledTableCell>
    //       </TableRow>
    //     </TableHead>
    //     <TableBody>
    //       {containers.map((c, i) => {
    //         const date = new Date(c.Created * 1000);
    //         const createdAtStr = `${date.toLocaleDateString(
    //           "en-US",
    //         )} ${date.toLocaleTimeString("en-US")}`;
    //         return (
    //           <StyledTableRow key={i}>
    //             <StyledTableCell component="th" scope="row">
    //               {c.Names[0].substring(1)}
    //             </StyledTableCell>
    //             <StyledTableCell align="right">{c.Image}</StyledTableCell>
    //             <StyledTableCell align="right">{c.Status}</StyledTableCell>
    //             <StyledTableCell align="right">{c.State}</StyledTableCell>
    //             <StyledTableCell align="right">{createdAtStr}</StyledTableCell>
    //           </StyledTableRow>
    //         );
    //       })}
    //     </TableBody>
    //   </Table>
    // </TableContainer>
  );
};

export default ContainerList;
// export { CustomizedTables };
