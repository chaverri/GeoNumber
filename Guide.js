import { Image } from "react-native";
import React, { useState } from "react";
import Onboarding from "react-native-onboarding-swiper";
import MainMap from "./MainMap";
import AsyncStorage from "@react-native-community/async-storage";

const Guide = () => {
  const [isDone, setIsDone] = useState(false);

  const finishOnboarding = () => {
    AsyncStorage.setItem("@is_first_time", "false").then(() => setIsDone(true));
  };

  return isDone == false ? (
    <Onboarding
      onDone={finishOnboarding}
      onSkip={finishOnboarding}
      pages={[
        {
          backgroundColor: "#fff",
          image: <Image source={require("./img/geohash_logo.png")} />,
          title: "Onboarding",
          subtitle: "Done with React Native Onboarding Swiper",
        },
        {
          backgroundColor: "#fe6e58",
          image: <Image source={require("./img/geohash_logo.png")} />,
          title: "The Title",
          subtitle: "This is the subtitle that sumplements the title.",
        },
        {
          backgroundColor: "#999",
          image: <Image source={require("./img/geohash_logo.png")} />,
          title: "Triangle",
          subtitle: "Beautiful, isn't it?",
        },
      ]}
    />
  ) : (
    <MainMap></MainMap>
  );
};

export default Guide;
