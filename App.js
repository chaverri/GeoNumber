import React, { Component } from 'react';
import { StyleSheet, Text, View, Alert} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Callout, Circle, Polygon } from 'react-native-maps';
import Geohash from 'latlon-geohash'

const latitudeDelta = 0.00122;
const longitudeDelta = 0.000421;
const defaultAccuracy = 0;

export default class App extends Component {
  temp = {
    lastLatitudeDelta: latitudeDelta,
    lastLongitudeDelta: longitudeDelta,
  };

  state = {
      latitude: 40.757960,
      longitude: -73.985563,
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
          latitude: this.round(position.coords.latitude),
          longitude: this.round(position.coords.longitude),
          isLoading: false,
          accuracy: Number(position.coords.accuracy.toFixed(0))
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

  getCurrentGeoHash(){
    try{
      return Geohash.encode(this.state.latitude, this.state.longitude, 9);
    }catch(error){
      return null;
    }
  }

  getFormattedGeoHash(){
      let geohash = this.getCurrentGeoHash();
      return geohash ? geohash.toUpperCase().replace(/(.{1})(.{4})(.{4})/gi, "$1-$2-$3") : '?-????-????';
  }

  getPolygonBounds(){
    let geohash = this.getCurrentGeoHash();

    if(!geohash){
      return [];
    }

    let polygonBounds=[];
    let bounds = Geohash.bounds(geohash);

    //NW
    polygonBounds.push({
      longitude: bounds.sw.lon,
      latitude: bounds.ne.lat
    });

    //NE
    polygonBounds.push({
      latitude: bounds.ne.lat,
      longitude: bounds.ne.lon,
    });

     //SE
     polygonBounds.push({
      longitude: bounds.ne.lon,
      latitude: bounds.sw.lat
    });

    //SW
    polygonBounds.push({
      latitude: bounds.sw.lat,
      longitude: bounds.sw.lon,
    });
    
    return polygonBounds;
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
            onDragStart={()=>{this.setState({latitudeDelta: this.temp.lastLatitudeDelta,
              longitudeDelta: this.temp.lastLongitudeDelta});}}
            onDrag={()=>{this.setState({isLoading:true})}}
            onDragEnd={(e) => this.setState({
              latitude : this.round(e.nativeEvent.coordinate.latitude),
              longitude: this.round(e.nativeEvent.coordinate.longitude),
              latitudeDelta: this.temp.lastLatitudeDelta,
              longitudeDelta: this.temp.lastLongitudeDelta,
              accuracy: defaultAccuracy,
              isLoading: false,
              tracksViewChanges: false
              })}>
              <Callout>
                <Text>Precisión GPS: {this.state.accuracy}m{'\u00B2'}</Text> 
              </Callout>
          </Marker>
          <Circle
            center={this.state}
            radius={this.state.accuracy}
            fillColor="rgba(138, 195, 214, 0.4)"
            strokeColor="rgba(44, 104, 125, 0.5)"
            strokeWidth={1}
          />
          <Polygon
              coordinates={this.getPolygonBounds()}
              strokeColor="rgba(255,0,0,0.5)"
              fillColor="rgba(255,0,0,0.2)"
              strokeWidth={1}
            />
          </MapView>
          <View style={styles.bottom}>
            <Text style={[styles.coordinates]}>{!isLoading ? this.getFormattedGeoHash() : '?-????-????'}</Text>
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
