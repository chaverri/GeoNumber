import React, { Component } from 'react';
import { Button, StyleSheet, Text, View, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

export default class App extends Component {
	state = {
		region: {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421
    }
	};

	findCoordinates = () => {
		navigator.geolocation.getCurrentPosition(
			position => {
				const location = JSON.stringify(position);

				this.setState({
          region: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421
          }
        });
			},
			error => Alert.alert(error.message),
			{ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
		);
	};

	render() {
		return (
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          region={this.state.region}
          style={StyleSheet.absoluteFill}
        />
        <Text>Location: {JSON.stringify(this.state.region)}</Text>
        <Button title="Locate me!" 
          onPress = {this.findCoordinates}
          />
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
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
