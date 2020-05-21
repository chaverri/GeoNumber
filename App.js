import React, { Component } from 'react';
import { StyleSheet, Text, View, Alert, ToastAndroid, Platform, AlertIOS, } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Callout, Circle } from 'react-native-maps';
import Geohash from 'latlon-geohash'

const latitudeDelta = 0.00122;
const longitudeDelta = 0.000421;
const defaultAccuracy = 4.7;

export default class App extends Component {
  temp = {
    lastLatitudeDelta: latitudeDelta,
    lastLongitudeDelta: longitudeDelta,
  };

  state = {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta,
      longitudeDelta,
      isLoading: false,
      accuracy: defaultAccuracy
	};

	findCoordinates() {
    this.setState({isLoading: true});
		navigator.geolocation.getCurrentPosition(
			position => {
				this.setState({
          latitude: this.round(position.coords.latitude) ,
          longitude: this.round(position.coords.longitude),
          isLoading: false,
          accuracy: position.coords.accuracy
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

  getFormattedCoordinates(){
    return Geohash.encode(this.state.latitude, this.state.longitude, 9).toUpperCase().replace(/(.{1})(.{4})(.{4})/gi, "$1-$2-$3");
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
          onLongPress={() => {this.findCoordinates()}}
          onRegionChangeComplete={(e)=>{
            this.temp.lastLatitudeDelta = this.round(e.latitudeDelta);
            this.temp.lastLongitudeDelta = this.round(e.longitudeDelta);
          }}
        >
          <Marker draggable
            coordinate={{
              latitude: this.state.latitude,
              longitude: this.state.longitude,
            }}
            anchor={{ x: 0.5, y: 0.9 }}
            image={isLoading ? require('./img/target_question.png') : require('./img/target.png')}
            onDrag={()=>{this.setState({isLoading:true})}}
            onDragEnd={(e) => this.setState({
              latitude : this.round(e.nativeEvent.coordinate.latitude),
              longitude: this.round(e.nativeEvent.coordinate.longitude),
              latitudeDelta: this.temp.lastLatitudeDelta,
              longitudeDelta: this.temp.lastLongitudeDelta,
              accuracy: defaultAccuracy,
              isLoading: false
              })}>
              <Callout>
                <Text>Precision: {this.state.accuracy}m{'\u00B2'}</Text> 
              </Callout>
          </Marker>
          <Circle
            center={this.state}
            radius={this.state.accuracy}
            fillColor="rgba(138, 195, 214, 0.4)"
            strokeColor="rgba(44, 104, 125, 0.5)"
            zIndex={2}
            strokeWidth={2}
          />
          </MapView>
          <View style={styles.bottom}>
            <Text style={[styles.coordinates]}>{isLoading ? '?-????-????' : this.getFormattedCoordinates() }</Text>
          </View>
          </View>
          
      </View>
    );
	}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  coordinates: {
    fontSize: 25,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  bottom: {
    position: 'absolute',
    bottom:65,
    backgroundColor: 'rgba(255,255,255, 0.8)',
    width: '100%',
    height: 40
  },
  map: {
    flex: 18
  }
});
