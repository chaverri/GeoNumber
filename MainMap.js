import React, { useState, useEffect } from "react";
import {
  Text,
  TextInput,
  View,
  Alert,
  Linking,
  Platform,
  Share,
  Image,
  PermissionsAndroid,
} from "react-native";
import MapView, {
  PROVIDER_DEFAULT,
  Marker,
  Callout,
  Circle,
  Polygon,
} from "react-native-maps";
import Overlay from "react-native-modal-overlay";
import { Icon, Button } from "react-native-elements";
import Geolocation from "react-native-geolocation-service";
import Clipboard from "@react-native-community/clipboard";
import Geohash from "latlon-geohash";
import Geocoding from "./Geocoding";
import Styles from "./styles/Style";

const defaultLatitudeDelta = 0.00122;
const defaultLongitudeDelta = 0.000421;
const defaultAccuracy = 0;
const unknownGeohash = "Obteniendo ubicación actual ...";
const hashPrecision = 9;

const mapMarkerAnchor = { x: 0.5, y: 0.9 };
const mapMarkerCenterOffset = { x: -2, y: -43 };

const latlonRegex = /(-?\d+(\.\d+)?),*(-?\d+(\.\d+)?)/g;
const formattedGeohashRegex = /(.{3})(.{3})(.{3})/gi;

const geolocationOptions = {
  enableHighAccuracy: true,
  timeout: 120000,
  maximumAge: 0,
};

const markerImage = require("./img/target.png");
let lastGeocodeQuery = null;

function MainMap() {
  let transtitiveMapDelta = {
    lastLatitudeDelta: defaultLatitudeDelta,
    lastLongitudeDelta: defaultLongitudeDelta,
  };

  const [mapLocation, setMapLocation] = useState({
    latitude: 40.75796,
    longitude: -73.985563,
  });
  const [mapLocationDelta, setMapLocationDelta] = useState({
    latitudeDelta: defaultLatitudeDelta,
    longitudeDelta: defaultLongitudeDelta,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [gpsAccuracy, setGPSAccuracy] = useState(defaultAccuracy);
  const [currentGeohash, setCurrentGeohash] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isHashInputValid, setIsHashInputValid] = useState(true);
  const [geohashInput, setGeohashInput] = useState("");
  const [formattedAddress, setFormattedAddress] = useState(null);
  const [quickMessage, setQuickMessage] = useState("");

  const requestAndroidGPSPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted;
    } catch (err) {
      throw err;
    }
  };

  const requestiOSGPSPermission = async () => {
    try {
      const granted = await Geolocation.requestAuthorization("whenInUse");
      return granted;
    } catch (err) {
      throw err;
    }
  };

  const getCurrentLocation = async () => {
    if (Platform.OS === "android") {
      requestAndroidGPSPermission().then((granted) => {
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getGPSLocation();
        }
      });
    } else {
      requestiOSGPSPermission().then((granted) => {
        if (granted === "granted") {
          getGPSLocation();
        }
      });
    }
  };

  const getGPSLocation = () => {
    setIsLoading(true);

    Geolocation.getCurrentPosition(
      (position) => {
        setMapLocation({
          latitude: roundCoordinates(position.coords.latitude),
          longitude: roundCoordinates(position.coords.longitude),
        });

        setGPSAccuracy(Number(position.coords.accuracy.toFixed(0)));
        setCurrentGeohash(getGeoHashFromCoordinates(position.coords));
        setIsLoading(false);
      },
      (error) => {
        Alert.alert(
          "Imposible obtener ubicación actual",
          "Por el momento se mostrará una ubicación de prueba.\n\nPor favor intente de nuevo",
          [
            {
              text: "OK",
              onPress: () => {
                setCurrentGeohash(getGeoHashFromCoordinates(mapLocation));
                setIsLoading(false);
              },
            },
          ]
        );
      },
      geolocationOptions
    );
  };

  const roundCoordinates = (coordinates) => {
    return Number(parseFloat(coordinates).toFixed(5));
  };

  const getCurrentGeoHash = () => {
    try {
      return Geohash.encode(
        mapLocation.latitude,
        mapLocation.longitude,
        hashPrecision
      );
    } catch (error) {
      return null;
    }
  };

  const getCurrentGeoHashFormatted = () => {
    return currentGeohash
      ? currentGeohash.toUpperCase().replace(formattedGeohashRegex, "$1-$2-$3")
      : unknownGeohash;
  };

  const getGeoHashFromCoordinates = (coordinates) => {
    try {
      return Geohash.encode(
        coordinates.latitude,
        coordinates.longitude,
        hashPrecision
      );
    } catch (error) {
      return null;
    }
  };

  const cleanGeohash = (geohash) => {
    return (
      geohash &&
      geohash.trim().replace(/-/g, "").toLowerCase().slice(0, hashPrecision)
    );
  };

  const parseGeohashToCoordinates = (geohash) => {
    try {
      coordinates = Geohash.decode(geohash);

      return {
        latitude: coordinates.lat,
        longitude: coordinates.lon,
      };
    } catch (e) {
      return null;
    }
  };

  const getGeohashAreaBounds = () => {
    let geohash = getCurrentGeoHash();

    if (!geohash) {
      return [];
    }

    let polygonBounds = [];
    let bounds = Geohash.bounds(geohash);

    //NW
    polygonBounds.push({
      longitude: bounds.sw.lon,
      latitude: bounds.ne.lat,
    });

    //NE
    polygonBounds.push({
      latitude: bounds.ne.lat,
      longitude: bounds.ne.lon,
    });

    //SE
    polygonBounds.push({
      longitude: bounds.ne.lon,
      latitude: bounds.sw.lat,
    });

    //SW
    polygonBounds.push({
      latitude: bounds.sw.lat,
      longitude: bounds.sw.lon,
    });

    return polygonBounds;
  };

  const showModal = () => {
    setIsModalVisible(true);
    hideInputError();
    setGeohashInput(getCurrentGeoHashFormatted());

    refreshFormattedAddress();
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const openInMap = () => {
    const scheme = Platform.select({
      ios: "maps:",
      android: "geo:",
    });

    const latLng = getCoordiantesAsString(mapLocation);
    const label = getCurrentGeoHashFormatted();
    const url = Platform.select({
      ios: `${scheme}${latLng}?q=${label}@${latLng}`,
      android: `${scheme}${latLng}?q=${latLng}(${label})`,
    });

    let browser_url = `https://maps.google.com/?q=${latLng}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(browser_url);
        }
      })
      .catch(() => {
        return Linking.openURL(browser_url);
      });
  };

  const showInputError = () => {
    setFormattedAddress(null);
    setIsHashInputValid(false);
  };

  const hideInputError = () => {
    setIsHashInputValid(true);
  };

  const getCoordiantesAsString = (coordinates) => {
    return `${coordinates.latitude},${coordinates.longitude}`;
  };

  const refreshFormattedAddress = () => {
    let currentLocationAsString = getCoordiantesAsString(mapLocation);
    if (lastGeocodeQuery === currentLocationAsString) {
      return;
    }

    lastGeocodeQuery = currentLocationAsString;
    setFormattedAddress(null);

    Geocoding.getFormattedAddress(mapLocation)
      .then((formattedAddressFromAPI) =>
        setFormattedAddress(formattedAddressFromAPI)
      )
      .catch((error) => {
        console.log(error);
        setFormattedAddress(null);
      });
  };

  const showQuickMessage = (message) => {
    setQuickMessage(message);
    setTimeout(() => {
      setQuickMessage("");
    }, 3000);
  };

  const initialUrlIntentHandler = (url) => {
    let coordinates = url.match(latlonRegex);
    let validCoordinate =
      coordinates &&
      coordinates.find(
        (coordinate) => coordinate.includes(",") && coordinate != "0,0"
      );
    if (validCoordinate) {
      let latitude = parseFloat(validCoordinate.split(",")[0]);
      let longitude = parseFloat(validCoordinate.split(",")[1]);
      let location = {
        latitude: roundCoordinates(latitude),
        longitude: roundCoordinates(longitude),
      };

      setMapLocation(location);
      setGPSAccuracy(defaultAccuracy);

      let geohash = getGeoHashFromCoordinates(location);
      setCurrentGeohash(geohash);

      setIsModalVisible(false);
    }
  };

  const linkingUrlEventListener = (e) => {
    if (e && e.url) {
      initialUrlIntentHandler(e.url);
    }
  };

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        initialUrlIntentHandler(url);
      } else {
        getCurrentLocation();
      }
    });
    Linking.addEventListener("url", linkingUrlEventListener);
  }, []);

  return (
    <View style={Styles.mainContainer}>
      <View style={Styles.mapView}>
        <MapView
          provider={PROVIDER_DEFAULT}
          region={{ ...mapLocation, ...mapLocationDelta }}
          style={Styles.map}
          onLongPress={getGPSLocation}
          onRegionChangeComplete={(region) => {
            transtitiveMapDelta = {
              lastLatitudeDelta: region.latitudeDelta,
              lastLongitudeDelta: region.longitudeDelta,
            };
          }}
        >
          <Marker
            draggable
            coordinate={mapLocation}
            anchor={mapMarkerAnchor}
            centerOffset={mapMarkerCenterOffset}
            onDragEnd={(e) => {
              setMapLocation({
                latitude: roundCoordinates(e.nativeEvent.coordinate.latitude),
                longitude: roundCoordinates(e.nativeEvent.coordinate.longitude),
              });

              setMapLocationDelta({
                latitudeDelta: transtitiveMapDelta.lastLatitudeDelta,
                longitudeDelta: transtitiveMapDelta.lastLongitudeDelta,
              });

              setGPSAccuracy(defaultAccuracy);

              setCurrentGeohash(
                getGeoHashFromCoordinates({
                  latitude: roundCoordinates(e.nativeEvent.coordinate.latitude),
                  longitude: roundCoordinates(
                    e.nativeEvent.coordinate.longitude
                  ),
                })
              );
              setIsLoading(false);
            }}
          >
            <Image source={markerImage} style={Styles.mapMarker} />
            <Callout style={Styles.markerCallout}>
              <Text>
                {`Latitud: ${mapLocation.latitude}` +
                  `\nLongitud: ${mapLocation.longitude}` +
                  `\nPrecisión del GPS: ${
                    gpsAccuracy > 0 ? gpsAccuracy + "m\u00B2" : "--"
                  }`}
              </Text>
            </Callout>
          </Marker>
          <Circle
            center={mapLocation}
            radius={gpsAccuracy}
            fillColor="#99ebfa26"
            strokeColor="#000000"
            strokeWidth={2}
          />
          <Polygon
            coordinates={getGeohashAreaBounds()}
            strokeColor="#000000"
            fillColor="#ff7d9666"
            strokeWidth={2}
          />
        </MapView>
        <View style={Styles.geohashView}>
          <Text style={Styles.geohashText} onPress={showModal}>
            {!isLoading ? getCurrentGeoHashFormatted() : unknownGeohash}
          </Text>
        </View>
      </View>
      <Overlay
        visible={isModalVisible}
        onClose={closeModal}
        containerStyle={Styles.overlayStyle}
        closeOnTouchOutside
      >
        <View style={Styles.modalInputView}>
          <TextInput
            style={Styles.hashInput}
            defaultValue={getCurrentGeoHashFormatted()}
            onChangeText={(value) => setGeohashInput(value)}
            value={geohashInput}
            maxLength={11}
          ></TextInput>
          <Button
            icon={
              <Icon
                type="font-awesome"
                name="arrow-right"
                color="#FFF"
                size={23}
              />
            }
            buttonStyle={Styles.hashInputButton}
            onPress={() => {
              hideInputError();
              setIsLoading(false);
              let cleanedGeohash = cleanGeohash(geohashInput);
              let parsedGeoHash = parseGeohashToCoordinates(cleanedGeohash);

              if (
                parsedGeoHash != null &&
                cleanedGeohash.length == hashPrecision
              ) {
                setMapLocation({
                  latitude: roundCoordinates(parsedGeoHash.latitude),
                  longitude: roundCoordinates(parsedGeoHash.longitude),
                });

                setGPSAccuracy(defaultAccuracy);
                setCurrentGeohash(cleanedGeohash);
                setIsModalVisible(false);
              } else {
                showInputError();
              }
            }}
          />
        </View>
        {/*Formatted address view --> */}
        <View
          style={{
            ...Styles.formattedAddress,
            display: formattedAddress ? "flex" : "none",
          }}
        >
          <Text>{formattedAddress}</Text>
        </View>
        {/*Error message view --> */}
        <View
          style={{
            ...Styles.hashInputErrorVIew,
            display: isHashInputValid ? "none" : "flex",
          }}
        >
          <Icon
            type="font-awesome-5"
            name="exclamation-circle"
            color="#b02944"
            size={20}
            style={Styles.hashInputErrorIcon}
          />
          <Text style={Styles.hashInputErrorMessage}>
            Código GeoNumber no reconocido.
          </Text>
        </View>
        {/*Modal buttons view --> */}
        <View style={Styles.row}>
          <Icon
            reverse
            raised
            name="copy"
            type="font-awesome-5"
            color="#495057"
            size={25}
            onPress={() => {
              Clipboard.setString(getCurrentGeoHashFormatted());
              showQuickMessage("El GeoNumber ha sido copiado!");
            }}
          />
          <Icon
            reverse
            raised
            name="paste"
            type="font-awesome-5"
            color="#495057"
            size={25}
            onPress={() => {
              Clipboard.getString().then((text) => {
                setGeohashInput(text);
              });
            }}
          />
          <Icon
            reverse
            raised
            name="share-alt"
            type="font-awesome-5"
            color="#495057"
            size={25}
            onPress={() => {
              Share.share({
                message: `${getCurrentGeoHashFormatted()}\n${formattedAddress}\nhttps://maps.google.com/?q=${getCoordiantesAsString(
                  mapLocation
                )}\n\nDescarga GeoNumber aquí si aún no la tienes: https://geonumber.page.link/download`,
              });
            }}
          />
          <Icon
            reverse
            raised
            name="map-marked-alt"
            type="font-awesome-5"
            color="#495057"
            size={25}
            onPress={() => {
              openInMap();
            }}
          />
        </View>
        {/*Modal quick message --> */}
        <View style={Styles.quickMessageView}>
          <Text style={Styles.quickMessageText}>{quickMessage}</Text>
        </View>
      </Overlay>
    </View>
  );
}

export default MainMap;
