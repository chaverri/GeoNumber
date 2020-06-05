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
          backgroundColor: "#f8f9f9",
          image: <Image source={require("./img/onboarding/low_res/geohash.png")} />,
          title: "¿Qué es un código GeoNumber?",
          subtitle: "Divide el mundo en cuadrantes de aproximadamente 4.7m\u00B2 a los cuales se les asigna un código de números y letras faciles de compartir",
        },
        {
          backgroundColor: "#f8f9f9",
          image: <Image source={require("./img/onboarding/low_res/long_press.png")} />,
          title: "Mantén presionado",
          subtitle: "Para obtener el código de tu ubicación actual",
        },
        {
          backgroundColor: "#f8f9f9",
          image: <Image source={require("./img/onboarding/low_res/marker_drag.png")} />,
          title: "Mantén el marcador presionado",
          subtitle: "Para arrastrarlo y ver el código de esa ubicación",
        },
        {
          backgroundColor: "#f8f9f9",
          image: <Image source={require("./img/onboarding/low_res/click_code.png")} />,
          title: "Presiona sobre el código actual",
          subtitle: "Para ver más opciones como compartir o ingresar uno nuevo",
        },
        {
          backgroundColor: "#fff",
          image: <Image source={require("./img/onboarding/low_res/hash_input.png")} />,
          title: "Puedes ingresar un código nuevo",
          subtitle: "Digitandolo o pegandolo desde otra aplicación, no te preocupes por los guiones o por mayúsculas o minúsculas",
        },
        {
          backgroundColor: "#fff",
          image: <Image source={require("./img/onboarding/low_res/share.png")} />,
          title: "El código actual",
          subtitle: "Puede ser compartido como texto o abrirse en tu aplicación de mapas favorita",
        },
      ]}
      skipLabel={'Saltar'}
      nextLabel={'Siguiente'}
    />
  ) : (
    <MainMap></MainMap>
  );
};

export default Guide;
