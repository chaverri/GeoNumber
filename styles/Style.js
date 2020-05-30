import { StyleSheet } from "react-native";

export default StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F5FCFF",
  },
  geohashText: {
    fontSize: 25,
    textAlign: "center",
    fontWeight: "bold",
  },
  geohashView: {
    position: "absolute",
    top: 85,
    backgroundColor: "rgba(255,255,255, 0.8)",
    width: "100%",
    height: 40,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  mapView: {
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
  mapMarker: { height: 100, width: 100 },
  modalInputView: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  hashInputButton: { backgroundColor: "black" },
  hashInputErrorVIew: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
    borderWidth: 1,
    borderColor: "#b02944",
  },
  formattedAddress: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    color: "#000"
  },
  hashInputErrorMessage: { margin: 4, color: "#b02944", fontWeight: "bold" },
  hashInputErrorIcon: { margin: 4 }
});
