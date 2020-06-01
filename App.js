import React, { useState } from "react";
import Guide from "./Guide";
import MainMap from "./MainMap";
import AsyncStorage from "@react-native-community/async-storage";

function App() {
  const [isFirstTime, setIsFirstTime] = useState(false);

  AsyncStorage.getItem("@is_first_time").then((existingValue) => {
    if (existingValue) {
      setIsFirstTime(false);
    } else {
      setIsFirstTime(true);
    }
  });

  return isFirstTime ? <Guide></Guide> : <MainMap></MainMap>;
}

export default App;
