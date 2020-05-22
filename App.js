import React, { Component } from 'react';
import { StyleSheet, Text, TextInput, View, Alert} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Callout, Circle, Polygon } from 'react-native-maps';
import Overlay from 'react-native-modal-overlay';
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
      accuracy: defaultAccuracy,
      currentGeohash:'',
      modalVisible: false
	};

	findCoordinates() {
    this.setState({isLoading: true});
		navigator.geolocation.getCurrentPosition(
			position => {
				this.setState({
          latitude: this.round(position.coords.latitude),
          longitude: this.round(position.coords.longitude),
          isLoading: false,
          accuracy: Number(position.coords.accuracy.toFixed(0)),
          currentGeohash: this.getGeoHash(position.coords)
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

  getGeoHash(coordinates){
    try{
      return Geohash.encode(coordinates.latitude, coordinates.longitude, 9);
    }catch(error){
      return null;
    }
  }

  refreshGeohash(){
    this.setState({currentGeohash : this.getCurrentGeoHash()});
  }

  getFormattedGeoHash(){
      let geohash = this.state.currentGeohash;
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

  openModal = () => this.setState({ modalVisible: true});

  onModalClose = () => this.setState({ modalVisible: false});

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
            onDragEnd={(e) => 

              this.setState({
                latitude : this.round(e.nativeEvent.coordinate.latitude),
                longitude: this.round(e.nativeEvent.coordinate.longitude),
                latitudeDelta: this.temp.lastLatitudeDelta,
                longitudeDelta: this.temp.lastLongitudeDelta,
                accuracy: defaultAccuracy,
                isLoading: false,
                tracksViewChanges: false,
                currentGeohash : this.getCurrentGeoHash({ 
                  latitude: this.round(e.nativeEvent.coordinate.latitude),
                  longitude: this.round(e.nativeEvent.coordinate.longitude)
                })
              })}
              >
                <Callout>
                  <Text>{'Precisión GPS: ' + (this.state.accuracy == 0 ? 'N/A' : this.state.accuracy  + 'm\u00B2') + '\nLatitud: ' + this.state.latitude + '\nLongitud: ' + this.state.longitude}</Text>
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
              {!isLoading ? this.getFormattedGeoHash() : '?-????-????'}
            </Text>
          </View>
          </View>
          <Overlay visible={this.state.modalVisible} onClose={this.onModalClose} closeOnTouchOutside>
            <TextInput defaultValue={this.getFormattedGeoHash()}></TextInput>
          </Overlay>
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
    top:85,
    backgroundColor: 'rgba(255,255,255, 0.8)',
    width: '100%',
    height: 40
  },
  map: {
    flex: 18
  }
});
