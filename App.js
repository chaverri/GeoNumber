import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Linking,
  Platform,
  Share,
  Image,
} from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Callout,
  Circle,
  Polygon,
} from "react-native-maps";
import Overlay from "react-native-modal-overlay";
import { Icon, Button } from "react-native-elements";
import Geolocation from "@react-native-community/geolocation";
import Geohash from "latlon-geohash";

const defaultLatitudeDelta = 0.00122;
const defaultLongitudeDelta = 0.000421;
const defaultAccuracy = 0;
const unknownGeohash = "?-????-????";
const geolocationOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
};

const markerImage = require("./img/target.png");
const unknownMarkerImage = require("./img/target_question.png");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FCFF",
  },
  coordinates: {
    fontSize: 25,
    textAlign: "center",
    fontWeight: "bold",
  },
  bottom: {
    position: "absolute",
    top: 85,
    backgroundColor: "rgba(255,255,255, 0.8)",
    width: "100%",
    height: 40,
  },
  map: {
    flex: 18,
  },
  hashInput: {
    marginBottom: 10,
    fontSize: 23,
    textAlign: "center",
    fontWeight: "bold",
    borderColor: "gray",
    borderWidth: 1,
    height: 40,
    width: "90%",
    textAlignVertical: "center",
    paddingTop: 0,
    paddingBottom: 0,
    color: "#000",
  },
  row: {
    flexDirection: "row",
  },
});

function App() {
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
      (error) => Alert.alert(error.message),
      geolocationOptions
    );
  };

  const roundCoordinates = (coordinate) => {
    return Number(parseFloat(coordinate).toFixed(5));
  };

  const getCurrentGeoHash = () => {
    try {
      return Geohash.encode(mapLocation.latitude, mapLocation.longitude, 9);
    } catch (error) {
      return null;
    }
  };

  const getGeoHashFromCoordinates = (coordinates) => {
    try {
      return Geohash.encode(coordinates.latitude, coordinates.longitude, 9);
    } catch (error) {
      return null;
    }
  };

  const getCurrentGeoHashFormatted = () => {
    return currentGeohash
      ? currentGeohash.toUpperCase().replace(/(.{1})(.{4})(.{4})/gi, "$1-$2-$3")
      : unknownGeohash;
  };

  const cleanGeohash = (geohash) => {
    return (
      geohash && geohash.trim().replace(/-/g, "").toLowerCase().slice(0, 9)
    );
  };

  const parseGeohashToCoordinates = (geohash) => {
    let coordinates = null;
    try {
      coordinates = Geohash.decode(geohash);

      return {
        latitude: coordinates.lat,
        longitude: coordinates.lon,
      };
    } catch (e) {}

    return coordinates;
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
    setGeohashInput(getCurrentGeoHashFormatted());
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const openInMap = () => {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });

    const latLng = `${mapLocation.latitude},${mapLocation.longitude}`;
    const label = getCurrentGeoHashFormatted();
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    let browser_url = `https://www.google.com/maps/search/?api=1&query=${mapLocation.latitude},${mapLocation.longitude}`;

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

  const showError = () => {
    setIsHashInputValid(false);
  };

  const hideError = () => {
    setIsHashInputValid(true);
  };

  useEffect(() => {
    getGPSLocation();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <MapView
          provider={PROVIDER_GOOGLE}
          region={{ ...mapLocation, ...mapLocationDelta }}
          style={[StyleSheet.absoluteFill]}
          onLongPress={getGPSLocation}
          onRegionChangeComplete={(region) => {
            transtitiveMapDelta = {
              lastLatitudeDelta: roundCoordinates(region.latitudeDelta),
              lastLongitudeDelta: roundCoordinates(region.longitudeDelta),
            };
          }}
        >
          <Marker
            draggable
            coordinate={mapLocation}
            anchor={{ x: 0.5, y: 0.9 }}
            onDragStart={() => {
              setMapLocationDelta({
                latitudeDelta: transtitiveMapDelta.lastLatitudeDelta,
                longitudeDelta: transtitiveMapDelta.lastLongitudeDelta,
              });
            }}
            onDrag={() => {
              setIsLoading(true);
            }}
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
            <Image
              source={isLoading ? unknownMarkerImage : markerImage}
              style={{ height: 100, width: 100 }}
            />
            <Callout>
              <Text>
                {"Precisión GPS: " +
                  (gpsAccuracy == 0 ? "N/A" : gpsAccuracy + "m\u00B2") +
                  "\nLatitud: " +
                  mapLocation.latitude +
                  "\nLongitud: " +
                  mapLocation.longitude}
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
        <View style={styles.bottom}>
          <Text style={[styles.coordinates]} onPress={showModal}>
            {!isLoading ? getCurrentGeoHashFormatted() : unknownGeohash}
          </Text>
        </View>
      </View>
      <Overlay
        visible={isModalVisible}
        onClose={closeModal}
        closeOnTouchOutside
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <TextInput
            style={styles.hashInput}
            defaultValue={getCurrentGeoHashFormatted()}
            onChangeText={(value) => setGeohashInput(value)}
            value={geohashInput}
            maxLength={15}
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
            buttonStyle={{ backgroundColor: "black" }}
            onPress={() => {
              hideError();
              let cleanedGeohash = cleanGeohash(geohashInput);
              let parsedGeoHash = parseGeohashToCoordinates(cleanedGeohash);

              if (parsedGeoHash != null && cleanedGeohash.length == 9) {
                setMapLocation({
                  latitude: parsedGeoHash.latitude,
                  longitude: parsedGeoHash.longitude,
                });

                setGPSAccuracy(defaultAccuracy);
                setCurrentGeohash(cleanedGeohash);
                setIsModalVisible(false);
              } else {
                showError();
              }
            }}
          />
        </View>
        {/*Error message view --> */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-start",
            width: "100%",
            borderWidth: 1,
            borderColor: "#b02944",
            display: isHashInputValid ? "none" : "flex",
          }}
        >
          <Icon
            type="font-awesome-5"
            name="exclamation-circle"
            color="#b02944"
            size={20}
            style={{ margin: 4 }}
          />
          <Text style={{ margin: 4, color: "#b02944", fontWeight: "bold" }}>
            No se pudo reconocer el geohash.
          </Text>
        </View>
        {/*Modal buttons view --> */}
        <View style={styles.row}>
          <Icon
            reverse
            raised
            name="share-alt"
            type="font-awesome-5"
            color="#000"
            size={25}
            onPress={() => {
              Share.share({
                message: `Geohash: ${getCurrentGeoHashFormatted()}`,
              });
            }}
          />
          <Icon
            reverse
            raised
            name="external-link-alt"
            type="font-awesome-5"
            color="#000"
            size={25}
            onPress={() => {
              openInMap();
            }}
          />
        </View>
      </Overlay>
    </View>
  );
}

export default App;
