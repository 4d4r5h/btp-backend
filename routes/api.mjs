import express from "express";
import routing from "../api/routing.mjs";
import Stations from "../models/stations.mjs";

const router = express.Router();

let defaultValue = {
  fullBatteryChargeCapacity: 1000000,
  dischargingRate: 1000,
  chargingRate: 1000000,
  chargingStations: [],
};

async function fetchChargingStations() {
  try {
    const chargingStations = await Stations.find();
    for (const chargingStation of chargingStations) {
      defaultValue.chargingStations.push({
        location: chargingStation.location,
        reservedFrom: chargingStation.reservedFrom,
        reservedTill: chargingStation.reservedTill,
      });
    }
  } catch (error) {
    throw error;
  }
}

function logMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  console.log('Memory Usage:');
  console.log(`- RSS: ${memoryUsage.rss} bytes`);
  console.log(`- Heap Total: ${memoryUsage.heapTotal} bytes`);
  console.log(`- Heap Used: ${memoryUsage.heapUsed} bytes`);
  console.log(`- External: ${memoryUsage.external} bytes`);
}

router.post("/api", async (req, res) => {
  try {
    logMemoryUsage();
    defaultValue.chargingStations.length = 0;
    await fetchChargingStations();
    const request = req.body;
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
    const response = await routing(request);
    defaultValue.chargingStations.length = 0;
    logMemoryUsage();
    return res.status(200).json(response);
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
