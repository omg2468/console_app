interface FunctionParameter {
  type: "array" | "object";
  dataFile: any;
  setDataFile: (value: any) => void;
  key: string;
  index?: number;
  paramKey: string;
  subParamKey?: string;
  value: any;
}

export const handleUpdateParameter = ({
  dataFile,
  setDataFile,
  key,
  index = -1,
  paramKey,
  subParamKey,
  value,
}: FunctionParameter) => {
  let newDataFile = { ...dataFile };
  
  switch (key) {
    case "rtu_master":
    case "rtu_slave":
    case "tcp_master":
    case "tcp_slave":
    case "common": {
      newDataFile[key][paramKey] = value;
      break;
    }
    case "ftp": {
      if (index < 0) break;
      if (subParamKey) {
        newDataFile[key][index][paramKey][subParamKey] = value;
        break;
      }
      newDataFile[key][index][paramKey] = value;
      break;
    }
    case "control": {
      newDataFile[key][paramKey] = value;
      break;
    }
    case "ais":
    case "dis":
    case "dos":
    case "tags":
    case "prog":
    case "timers":
    case "modbus_reader": {
      if (index < 0) break;
      newDataFile[key][index][paramKey] = value;
      break;
    }
    default:
      break;
  }

  setDataFile({...newDataFile});
};
