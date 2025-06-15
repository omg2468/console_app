const Control = () => {
  return (
    <div className='w-full overflow-x-scroll h-full flex flex-row flex-1 p-2'>
      <div className='h-full w-full min-w-[350px] flex flex-1 flex-col gap-2 '>
        <span className='text-xs font-semibold'>NETWORK SETTING</span>
        <div className='border flex-1'>
          <table className='w-full h-full max-h-[400px] border-collapse'>
            <tbody>
              <tr>
                <td className='border-r border-b p-2 text-right'>
                  <span className='font-extrabold text-base'>DHCP</span>
                </td>
                <td className='p-2 border-b text-left '>
                  <div className='w-full h-full flex items-center justify-start'>
                    <input type='checkbox' className='w-4 h-4' checked={true} />
                  </div>
                </td>
              </tr>
              <tr>
                <td className='border-r border-b p-2 text-right'>IP</td>
                <td className='p-2 border-b text-left'>192.168.1.16</td>
              </tr>
              <tr>
                <td className='border-r border-b p-2 text-right'>Netmask</td>
                <td className='p-2 border-b text-left'>255.255.255.0</td>
              </tr>
              <tr>
                <td className='border-r border-b p-2 text-right'>Gateway</td>
                <td className='p-2 border-b text-left'>192.168.1.1</td>
              </tr>
              <tr>
                <td className='border-r border-b p-2 text-right'>Dns</td>
                <td className='p-2 border-b text-left'>8.8.8.8</td>
              </tr>
              <tr>
                <td className='border-r border-b p-2 text-right'>Proxy</td>
                <td className='p-2 border-b text-left'>direct</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className='flex flex-col gap-1'>
          <div className='flex flex-row w-full items-center justify-center gap-2'>
            <div className='flex-1 text-center text-xs border py-1 bg-gray-200 cursor-pointer hover:bg-gray-300'>
              GET NETWORK
            </div>
            <div className='flex-1 text-center text-xs border py-1 bg-gray-200 cursor-pointer hover:bg-gray-300'>
              SET NETWORK
            </div>
          </div>
          <span className='font-black text-sm pt-2'>ANALOG INPUT</span>
          <div className='gap-2 flex items-center justify-start '>
            <input type='checkbox' className='w-4 h-4' checked={true} />
            <span className='text-sm'>Display analog value</span>
          </div>
          <div className='w-full flex-shrink-1' style={{ maxHeight: 350 }}>
            <div style={{ maxHeight: 310, overflowY: "auto" }}>
              <table className='w-full'>
                <colgroup>
                  <col style={{ minWidth: "150px" }} />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th className='border-r w-[150px] border-b p-2 text-right'>
                      Parameter
                    </th>
                    <th className='p-2 border-b text-left win-[150px] min-w-[200px]'>
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 12 }, (_, index) => (
                    <tr key={index}>
                      <td className='border-r border-b p-2 text-right min-w-[150px] whitespace-nowrap'>
                        Analog input  {index + 1}
                      </td>
                      <td className='p-2 border-box border-b text-left min-w-[200px]'>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className='flex flex-col h-full w-full'>
        <div className='grid grid-cols-3 grid-rows-3 gap-2 h-full'>
          {Array.from({ length: 9 }, (_, index) => (
            <div
              key={index}
              className='w-16 h-16 border flex items-center justify-center bg-gray-100 cursor-pointer hover:bg-gray-200'
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Control;
