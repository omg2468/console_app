import { useCallback } from "react";
import { handleUpdateParameter } from "./functions";

const ReadParameter = ({ parameter, setParameter, dataFile, setDataFile }) => {
  const readParameter = useCallback(
    (item) => {
      switch (item.key) {
        case "rtu_master":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b'>
                      Modbus RTU master
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'></th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Enable
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.en}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "en",
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Baudrate
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.baudrate}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Parity
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.parity}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "parity",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={"N"}>None</option>
                            <option value={"E"}>Even</option>
                            <option value={"O"}>Odd</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Stop bits
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.stopbits}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "stopbits",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Round delay(ms)
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.rddelay}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Read delay(ms)
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.delay}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Wait max(ms)
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.wait}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Retry
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.retry}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "rtu_slave":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b'>
                      Modbus RTU slave
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'></th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Enable
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "en",
                                value: event.target.checked,
                              });
                            }}
                            checked={!!parameter.value.en}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          ID
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.id}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Baudrate
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.baudrate}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Parity
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.parity}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "parity",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={"N"}>None</option>
                            <option value={"E"}>Even</option>
                            <option value={"O"}>Odd</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Stop bits
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.stopbits}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "stopbits",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Data order
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.order}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "order",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={0}>AB CD</option>
                            <option value={1}>CD AB</option>
                            <option value={2}>BA DC</option>
                            <option value={3}>DC BA</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Address offset
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.offset}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "tcp_master":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b'>
                      Modbus TCP master
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'></th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Enable
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "en",
                                value: event.target.checked,
                              });
                            }}
                            checked={!!parameter.value.en}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Delay
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.delay}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "tcp_slave":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b'>
                      Modbus TCP slave
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'></th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Enable
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "en",
                                value: event.target.checked,
                              });
                            }}
                            checked={!!parameter.value.en}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Port
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.port}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          UnitID
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.id}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Data order
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.parity}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "order",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={0}>AB CD</option>
                            <option value={1}>CD AB</option>
                            <option value={2}>BA DC</option>
                            <option value={3}>DC BA</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Address offset
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.offset}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "common":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b'>
                      System common
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'></th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          LCD page time
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.page_dur}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Sync time from
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.time_sync}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "time_sync",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={0}>None</option>
                            <option value={1}>Internet</option>
                            <option value={2}>Control server</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Null context
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.null_ctx}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "null_ctx",
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Config port
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.conf_port}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Report precision
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.precision}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          AI location
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.ai_loc}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          DI location
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.di_loc}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          DO location
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.do_loc}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Memory persistent
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.persist}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "persist",
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "ftp":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b'>
                      Ftp Server
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'>
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Enable
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.en}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                index: item.idx,
                                paramKey: "en",
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Global
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.client.global}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                index: item.idx,
                                paramKey: "client",
                                subParamKey: "global",
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Make directory
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.client.make_dir_type}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                index: item.idx,
                                paramKey: "client",
                                subParamKey: "make_dir_type",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={0}>Normal</option>
                            <option value={1}>Day only</option>
                            <option value={2}>Ignore</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Ip/hostname
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='text'
                            value={parameter.value.client.ip}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                index: item.idx,
                                paramKey: "client",
                                subParamKey: "ip",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg px-2 py-1 w-full'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Port
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.client.port}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Username
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.client.user}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Password
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.passwd}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Log folder
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.remote_prefix}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Assert
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.client.assert}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                index: item.idx,
                                paramKey: "client",
                                subParamKey: "assert",
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Disable EPASV
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.client.dep}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                index: item.idx,
                                paramKey: "client",
                                subParamKey: "dep",
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Provin
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.creator.provin}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          District
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.creator.district}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Station
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.creator.station}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          File type
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.creator.file_type}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                index: item.idx,
                                paramKey: "creator",
                                subParamKey: "file_type",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={0}>TXT</option>
                            <option value={1}>CSV</option>
                            <option value={2}>CUSTOM</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Backup months
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.creator.keep_month}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                index: item.idx,
                                paramKey: "creator",
                                subParamKey: "keep_month",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Log duration
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.duration}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Log at second
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.second}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Copy to Sdcard
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.client.clone}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                index: item.idx,
                                paramKey: "client",
                                subParamKey: "clone",
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "control":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b'>
                      Control Server
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'></th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Enable
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.en}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "en",
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Type
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.type}
                            onChange={(e) =>
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "type",
                                value: e.target.value,
                              })
                            }
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={0}>RAW</option>
                            <option value={1}>MQTT</option>
                            <option value={2}>UDP</option>
                            <option value={3}>UDP</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Ip/hostname
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.ip}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Port
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.port}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Username
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.user}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Password
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.password}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Identify
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.uuid}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Identify2
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.uuid2}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Pin index
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.index}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Pulse Duty(s)
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.duty}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Port 2
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.port2}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Username 2
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.user2}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Password 2
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.password2}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "di":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b '>
                      {item.key.toUpperCase()}
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'>
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Active level
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.act_lev === 0
                            ? "High"
                            : parameter.value.act_lev === 1
                            ? "Low"
                            : ""}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Function
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.act_type === 0
                            ? "Pulse"
                            : parameter.value.act_type === 1
                            ? "Level"
                            : ""}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Value per pulse
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.increment}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "do":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b '>
                      {item.key.toUpperCase()}
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'>
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Active type
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.act_lev === 0
                            ? "High"
                            : parameter.value.act_lev === 1
                            ? "Low"
                            : ""}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Control type
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.act_type === 0
                            ? "Pulse"
                            : parameter.value.act_type === 1
                            ? "Level"
                            : ""}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Duty (s)
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.duty}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Period
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.period}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "tags":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b '>
                      TAG
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'>
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Enabled
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.en}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "en",
                                index: item.idx,
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Description
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.desc}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Name
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.name}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Unit
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.unit}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Value index
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.val_idx}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Use 64bits
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.flag}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: item.key,
                                paramKey: "flag",
                                index: item.idx,
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Status index
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.stat_idx}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Report ftp servers
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.unit}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Average
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.avg}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "program":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b '>
                      Program
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'>
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Enabled
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.en}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "prog",
                                paramKey: "en",
                                index: item.idx,
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Description
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.desc}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Code
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          <textarea
                            value={parameter.value.code}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "prog",
                                paramKey: "code",
                                index: item.idx,
                                value: event.target.value,
                              });
                            }}
                            rows={25}
                            className='bg-gray-50 border max-w-[550px] border-gray-300 text-gray-900 text-sm rounded-lg px-2 py-1 w-full resize-y font-mono'
                            placeholder='Enter code here...'
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "timer":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b '>
                      Timer
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'>
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Enabled
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.en}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "timers",
                                paramKey: "en",
                                index: item.idx,
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Oneshot
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.one}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "timers",
                                paramKey: "one",
                                index: item.idx,
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Interval
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.int}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Descripton
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.desc}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Code
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          <textarea
                            value={parameter.value.code}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "timers",
                                paramKey: "code",
                                index: item.idx,
                                value: event.target.value,
                              });
                            }}
                            rows={25}
                            className='bg-gray-50 border max-w-[550px] border-gray-300 text-gray-900 text-sm rounded-lg px-2 py-1 w-full resize-y font-mono'
                            placeholder='Enter code here...'
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        case "modbus":
          return (
            <div className='h-full flex-1'>
              <table className='w-full'>
                <thead>
                  <tr className=''>
                    <th className='px-2 py-1 text-sm text-center min-w-[150px] border-b'>
                      Parameter
                    </th>
                    <th className='px-2 py-1 text-sm text-center w-full border-b border-l border-r'>
                      Value
                    </th>
                  </tr>
                  <tr className='bg-gray-200'>
                    <th className='px-2 py-1 text-sm text-right min-w-[150px] border-b '>
                      Modbus reader
                    </th>
                    <th className='px-2 py-1 text-sm text-left w-full border-b font-normal'>
                      {item.idx}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {item.value && (
                    <>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Description
                        </td>
                        <td className='px-2 py-1 text-sm font-normat'>
                          {parameter.value.desc}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Enabled
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.en}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "modbus_reader",
                                paramKey: "en",
                                index: item.idx,
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Type
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.type}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "modbus_reader",
                                paramKey: "type",
                                index: item.idx,
                                value: event.target.value,
                              });
                            }}
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={1}>RTU</option>
                            <option value={2}>TCP</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Address
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.dev_a}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          ID
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.id}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Register address
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.reg_a}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Data Type
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.d_t}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "modbus_reader",
                                paramKey: "d_t",
                                index: item.idx,
                                value: event.target.value,
                              });
                            }}
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={1}>Discrete Input</option>
                            <option value={2}>Holding register</option>
                            <option value={3}>Coil</option>
                            <option value={4}>Input register</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Data order
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.d_o}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "modbus_reader",
                                paramKey: "d_o",
                                index: item.idx,
                                value: event.target.value,
                              });
                            }}
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={0}>AB CD</option>
                            <option value={1}>CD AB</option>
                            <option value={2}>BA DC</option>
                            <option value={3}>DC BA</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Data format
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <select
                            value={parameter.value.d_f}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "modbus_reader",
                                paramKey: "d_f",
                                index: item.idx,
                                value: event.target.value,
                              });
                            }}
                            className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg max-w-[150px]'
                          >
                            <option value={0}>8bits integer</option>
                            <option value={1}>16bit integer</option>
                            <option value={2}>32bit integer</option>
                            <option value={3}>32bit floating</option>
                            <option value={4}>64bit integer</option>
                            <option value={5}>64bit floating</option>
                          </select>
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Number object
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.n_obj}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Values location
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.loc_val}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Status location
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          {parameter.value.loc_stat}
                        </td>
                      </tr>
                      <tr className=''>
                        <td className='px-2 py-1 text-sm text-right font-semibold'>
                          Hold when read fail
                        </td>
                        <td className='px-2 py-1 text-sm'>
                          <input
                            type='checkbox'
                            checked={!!parameter.value.kf}
                            onChange={(event) => {
                              handleUpdateParameter({
                                dataFile,
                                setDataFile,
                                key: "modbus_reader",
                                paramKey: "kf",
                                index: item.idx,
                                value: event.target.checked,
                              });
                            }}
                            className='w-4 h-4 accent-blue-500 cursor-pointer'
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          );
        default:
          return null;
      }
    },
    [parameter, setParameter],
  );

  return <>{readParameter(parameter)}</>;
};

export default ReadParameter;
