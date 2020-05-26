import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Linking,
  Platform,
  Share,
} from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Callout,
  Circle,
  Polygon,
} from "react-native-maps";
import Overlay from "react-native-modal-overlay";
import { Icon } from "react-native-elements";
import { Button } from "react-native-elements";
//import Geolocation from '@react-native-community/geolocation';
import Geohash from "latlon-geohash";

const latitudeDelta = 0.00122;
const longitudeDelta = 0.000421;
const defaultAccuracy = 0;

export default class App extends Component {
  temp = {
    lastLatitudeDelta: latitudeDelta,
    lastLongitudeDelta: longitudeDelta,
  };

  state = {
    latitude: 40.75796,
    longitude: -73.985563,
    latitudeDelta,
    longitudeDelta,
    isLoading: false,
    accuracy: defaultAccuracy,
    currentGeohash: "",
    modalVisible: false,
    geohashErrorVisible: false,
    geohashInput: "",
  };

  findCoordinates() {
    this.setState({ isLoading: true });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setState({
          latitude: this.round(position.coords.latitude),
          longitude: this.round(position.coords.longitude),
          isLoading: false,
          accuracy: Number(position.coords.accuracy.toFixed(0)),
          currentGeohash: this.getGeoHash(position.coords),
        });
      },
      (error) => Alert.alert(error.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  componentDidMount() {
    this.findCoordinates();
  }

  round(coordinate) {
    return Number(parseFloat(coordinate).toFixed(5));
  }

  getCurrentGeoHash() {
    try {
      return Geohash.encode(this.state.latitude, this.state.longitude, 9);
    } catch (error) {
      return null;
    }
  }

  getGeoHash(coordinates) {
    try {
      return Geohash.encode(coordinates.latitude, coordinates.longitude, 9);
    } catch (error) {
      return null;
    }
  }

  getFormattedGeoHash() {
    let geohash = this.state.currentGeohash;
    return geohash
      ? geohash.toUpperCase().replace(/(.{1})(.{4})(.{4})/gi, "$1-$2-$3")
      : "?-????-????";
  }

  cleanGeohash(geohash) {
    return (
      geohash && geohash.trim().replace(/-/g, "").toLowerCase().slice(0, 9)
    );
  }

  tryToParseGeohash(geohash) {
    let coordinates = null;
    try {
      coordinates = Geohash.decode(geohash);
    } catch (e) {}

    return coordinates;
  }

  getPolygonBounds() {
    let geohash = this.getCurrentGeoHash();

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
  }

  openModal = () => {
    this.setState({
      modalVisible: true,
      geohashInput: this.getFormattedGeoHash(),
    });
  };

  onModalClose = () => this.setState({ modalVisible: false });

  openInMap() {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${this.state.latitude},${this.state.longitude}`;
    const label = this.getFormattedGeoHash();
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    let browser_url = `https://www.google.com/maps/search/?api=1&query=${this.state.latitude},${this.state.longitude}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(browser_url);
        }
      })
      .catch((error) => {
        return Linking.openURL(browser_url);
      });
  }

  showError() {
    this.setState({
      geohashErrorVisible: true,
    });
  }

  hideError() {
    this.setState({
      geohashErrorVisible: false,
    });
  }

  render() {
    const isLoading = this.state.isLoading;
    return (
      <View style={styles.container}>
        <View style={styles.map}>
          <MapView
            provider={PROVIDER_GOOGLE}
            region={this.state}
            style={[StyleSheet.absoluteFill]}
            onLongPress={() => {
              this.findCoordinates();
            }}
            onRegionChangeComplete={(e) => {
              this.temp.lastLatitudeDelta = this.round(e.latitudeDelta);
              this.temp.lastLongitudeDelta = this.round(e.longitudeDelta);
            }}
          >
            <Marker
              draggable
              coordinate={{
                latitude: this.state.latitude,
                longitude: this.state.longitude,
              }}
              anchor={{ x: 0.5, y: 0.9 }}
              image={
                isLoading
                  ? require("./img/target_question.png")
                  : require("./img/target.png")
              }
              onDragStart={() => {
                this.setState({
                  latitudeDelta: this.temp.lastLatitudeDelta,
                  longitudeDelta: this.temp.lastLongitudeDelta,
                });
              }}
              onDrag={() => {
                this.setState({ isLoading: true });
              }}
              onDragEnd={(e) =>
                this.setState({
                  latitude: this.round(e.nativeEvent.coordinate.latitude),
                  longitude: this.round(e.nativeEvent.coordinate.longitude),
                  latitudeDelta: this.temp.lastLatitudeDelta,
                  longitudeDelta: this.temp.lastLongitudeDelta,
                  accuracy: defaultAccuracy,
                  isLoading: false,
                  tracksViewChanges: false,
                  currentGeohash: this.getCurrentGeoHash({
                    latitude: this.round(e.nativeEvent.coordinate.latitude),
                    longitude: this.round(e.nativeEvent.coordinate.longitude),
                  }),
                })
              }
            >
              <Callout>
                <Text>
                  {"Precisión GPS: " +
                    (this.state.accuracy == 0
                      ? "N/A"
                      : this.state.accuracy + "m\u00B2") +
                    "\nLatitud: " +
                    this.state.latitude +
                    "\nLongitud: " +
                    this.state.longitude}
                </Text>
              </Callout>
            </Marker>
            <Circle
              center={this.state}
              radius={this.state.accuracy}
              fillColor="#99ebfa26"
              strokeColor="#000000"
              strokeWidth={2}
            />
            <Polygon
              coordinates={this.getPolygonBounds()}
              strokeColor="#000000"
              fillColor="#ff7d9666"
              strokeWidth={2}
            />
          </MapView>
          <View style={styles.bottom}>
            <Text style={[styles.coordinates]} onPress={this.openModal}>
              {!isLoading ? this.getFormattedGeoHash() : "?-????-????"}
            </Text>
          </View>
        </View>
        <Overlay
          visible={this.state.modalVisible}
          onClose={this.onModalClose}
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
              defaultValue={this.getFormattedGeoHash()}
              onChangeText={(value) => this.setState({ geohashInput: value })}
              value={this.state.geohashInput}
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
                this.hideError();
                let cleanGeohash = this.cleanGeohash(this.state.geohashInput);
                let parsedGeoHash = this.tryToParseGeohash(cleanGeohash);

                if (parsedGeoHash != null && cleanGeohash.length == 9) {
                  this.setState({
                    latitude: parsedGeoHash.lat,
                    longitude: parsedGeoHash.lon,
                    accuracy: defaultAccuracy,
                    modalVisible: false,
                    currentGeohash: cleanGeohash,
                  });
                } else {
                  this.showError();
                }
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              width: "100%",
              borderWidth: 1,
              borderColor: "#b02944",
              display: this.state.geohashErrorVisible == true ? "flex" : "none",
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
                  message: `Geohash: ${this.getFormattedGeoHash()}`,
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
                this.openInMap();
              }}
            />
          </View>
        </Overlay>
      </View>
    );
  }
}

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
  },
  row: {
    flexDirection: "row",
  },
});
