import express from "express";
import routing from "../api/routing.mjs";
import Stations from "../models/stations.mjs";

const router = express.Router();

async function fetchChargingStations() {
  try {
    const chargingStations = await Stations.find().lean();
    return chargingStations.map((chargingStation) => ({
      location: chargingStation.location,
      reservedFrom: chargingStation.reservedFrom,
      reservedTill: chargingStation.reservedTill,
    }));
  } catch (error) {
    throw error;
  }
}

router.post("/api", async (req, res) => {
  try {
    const defaultValue = {
      fullBatteryChargeCapacity: 1000000,
      dischargingRate: 1000,
      chargingRate: 1000000,
      chargingStations: [],
    };
    defaultValue.chargingStations = await fetchChargingStations();
    let request = req.body;
    if (!request.hasOwnProperty("waypoints") || request.waypoints.length < 2) {
      return res.status(400).json({
        error: {
          name: "ValidationError",
          message:
            "At least two waypoints (source and destination) are required.",
        },
      });
    }
    if (
      !request.hasOwnProperty("initialBatteryCharge") ||
      isNaN(request.initialBatteryCharge) ||
      request.initialBatteryCharge > defaultValue.fullBatteryChargeCapacity
    ) {
      return res.status(400).json({
        error: {
          name: "ValidationError",
          message:
            "Initial battery charge is required and must be a valid number.",
        },
      });
    }
    if (!request.hasOwnProperty("fullBatteryChargeCapacity")) {
      request.fullBatteryChargeCapacity =
        defaultValue.fullBatteryChargeCapacity;
    }
    if (!request.hasOwnProperty("dischargingRate")) {
      request.dischargingRate = defaultValue.dischargingRate;
    }
    if (!request.hasOwnProperty("chargingRate")) {
      request.chargingRate = defaultValue.chargingRate;
    }
    request.chargingStations = defaultValue.chargingStations;
    let response = await routing(request);
    res.status(200).json(response);
    request = null;
    response = null;
  } catch (error) {
    res.status(500).json({
      error: {
        name: error.name,
        message: error.message,
      },
    });
  }
});

export default router;
