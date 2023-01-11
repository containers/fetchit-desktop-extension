import React from "react";
import { Container } from "../types";

type ContainerListProps = {
  containers: Container[];
};

const ContainerList: React.FC<ContainerListProps> = (
  props: ContainerListProps,
) => {
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
          {containers.map((v, i) => (
            <>
              <tr
                key={2 * i}
                className="group px-4 w-full my-2 min-w-full h-12 bg-zinc-900 hover:bg-zinc-700 rounded-xl mx-4"
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
  );
};

export default ContainerList;
