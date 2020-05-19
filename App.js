import React, { Component } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import Geohash from 'latlon-geohash'

const latitudeDelta = 0.000922;
const longitudeDelta = 0.000421;

export default class App extends Component {
  state = {
		region: {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta,
      longitudeDelta
    },
    isLoading: false
	};

	findCoordinates() {
    this.setState({isLoading: true});
		navigator.geolocation.getCurrentPosition(
			position => {
				this.setState({
          region: {
            latitude: this.round(position.coords.latitude) ,
            longitude: this.round(position.coords.longitude),
            latitudeDelta,
            longitudeDelta
          },
          isLoading: false
        });
			},
			error => Alert.alert(error.message),
			{ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
		);
  }
  
  componentDidMount() {
    this.findCoordinates();
  }

  round(coordinate) {
    return Number(parseFloat(coordinate).toFixed(5));
  }

	render() {

    const isLoading = this.state.isLoading;
		return (
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          region={this.state.region}
          style={StyleSheet.absoluteFill}
          onLongPress={() => {this.findCoordinates()}}
        >
          <Marker draggable
            coordinate={{
              latitude: this.state.region.latitude,
              longitude: this.state.region.longitude,
            }}
            centerOffset={{ x: -18, y: -60 }}
            anchor={{ x: 0.69, y: 1 }}
            image={require('./img/map-marker.png')}
            onDragEnd={(e) => this.setState({ region: {
              latitude : this.round(e.nativeEvent.coordinate.latitude),
              longitude: this.round(e.nativeEvent.coordinate.longitude),
              latitudeDelta,
              longitudeDelta
            }
            })}
          >
          </Marker>
          </MapView>
        <Text style={ styles.welcome}>{isLoading ? 'Loading ...' : Geohash.encode(this.state.region.latitude, this.state.region.longitude, 9).toUpperCase().replace(/(.{1})(.{4})(.{4})/gi, "$1-$2-$3") }</Text>
      </View>
    );
	}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 25,
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold'
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
