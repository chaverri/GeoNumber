class Geocoding {
  static api_key = "AIzaSyAKvwE4FnOZuPV1hipBVKFv5Hawk23mqJc";

  /**
   * Gets a formatted address from Google Geocoding API
   *
   * @param   {{latitude: number, longitude: number}} coordinates Geographical coordinates to convert
   * @returns {string} Geocoding API formatted address
   */
  static getFormattedAddress(coordinates) {
    let promise = new Promise(function (resolve) {
      fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${Geocoding.api_key}&language=es`
      )
        .then((response) => response.json())
        .then((json) => {
          let mainResult = json.results[0];

          let formattedAddress = null;

          if (mainResult) {
            formattedAddress = mainResult.formatted_address;
          }

          resolve(formattedAddress);
        });
    });

    return promise;
  }
}

export default Geocoding;
