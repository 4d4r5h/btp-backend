import express from "express";
import mongoose from "mongoose";
import Trips from "../models/trips.mjs";
import Stations from "../models/stations.mjs";
import Users from "../models/users.mjs";

const router = express.Router();

function isValidLocation(latitude, longitude) {
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

router.post("/start_trip", async (req, res) => {
  try {
    let { username, startLocation, endLocation, chargingStations } = req.body;
    username = username.trim();
    if (!isValidLocation(startLocation.latitude, startLocation.longitude)) {
      return res.status(400).json({
        error: {
          name: "InvalidLocationError",
          message: "Invalid latitude or longitude values for startLocation.",
        },
      });
    }
    if (!isValidLocation(endLocation.latitude, endLocation.longitude)) {
      return res.status(400).json({
        error: {
          name: "InvalidLocationError",
          message: "Invalid latitude or longitude values for endLocation.",
        },
      });
    }
    const user = await Users.findOne({ username });
    if (!user) {
      return res.status(400).json({
        error: {
          name: "UserNotFoundError",
          message: "Username does not exist in the Users model.",
        },
      });
    }
    for (const chargingStation of chargingStations) {
      const latitude = chargingStation.latitude;
      const longitude = chargingStation.longitude;
      if (!isValidLocation(latitude, longitude)) {
        return res.status(400).json({
          error: {
            name: "InvalidLocationError",
            message:
              "Invalid latitude or longitude values for a charging station.",
          },
        });
      }
      const station = await Stations.findOne({
        "location.latitude": latitude,
        "location.longitude": longitude,
      });
      if (!station) {
        return res.status(400).json({
          error: {
            name: "StationNotFoundError",
            message: "Station does not exist in the Stations model.",
          },
        });
      }
    }
    const currentDate = new Date();
    for (const chargingStation of chargingStations) {
      const latitude = chargingStation.latitude;
      const longitude = chargingStation.longitude;
      const station = await Stations.findOne({
        "location.latitude": latitude,
        "location.longitude": longitude,
      });
      station.reservedFrom = currentDate;
      await station.save();
    }
    const request = {
      username: username,
      startLocation: startLocation,
      endLocation: endLocation,
      chargingStations: chargingStations,
      startTime: currentDate,
    };
    const trip = new Trips(request);
    await trip.save();
    const response = {
      id: trip._id,
      username: trip.username,
      startLocation: trip.startLocation,
      endLocation: trip.endLocation,
      chargingStations: trip.chargingStations,
      startTime: trip.startTime,
    };
    res.status(200).json(response);
    console.log("Trip has started.");
  } catch (error) {
    res.status(500).json({
      error: {
        name: error.name,
        message: error.message,
      },
    });
  }
});

router.post("/end_trip", async (req, res) => {
  try {
    const { id } = req.body;
    const tripID = new mongoose.Types.ObjectId(id);
    const trip = await Trips.findById(tripID);
    if (!trip) {
      return res.status(400).json({
        error: {
          name: "TripNotFoundError",
          message: "Trip not found with the provided ID.",
        },
      });
    }
    if (trip.isCompleted) {
      return res.status(400).json({
        error: {
          name: "TripAlreadyCompletedError",
          message: "Trip already completed with the provided ID.",
        },
      });
    }
    const currentDate = new Date();
    const chargingStations = trip.chargingStations;
    for (const chargingStation of chargingStations) {
      const latitude = chargingStation.latitude;
      const longitude = chargingStation.longitude;
      const station = await Stations.findOne({
        "location.latitude": latitude,
        "location.longitude": longitude,
      });
      station.reservedFrom = null;
      await station.save();
    }
    trip.endTime = currentDate;
    trip.isCompleted = true;
    await trip.save();
    const response = {
      id: trip._id,
      username: trip.username,
      startLocation: trip.startLocation,
      endLocation: trip.endLocation,
      chargingStations: trip.chargingStations,
      startTime: trip.startTime,
      endTime: trip.endTime,
      isCompleted: trip.isCompleted,
    };
    res.status(200).json(response);
    console.log("Trip has ended.");
  } catch (error) {
    res.status(500).json({
      error: {
        name: error.name,
        message: error.message,
      },
    });
  }
});

router.get("/show_trips", async (req, res) => {
  try {
    const trips = await Trips.find();
    let response = [];
    for (const trip of trips) {
      response.push({
        id: trip._id,
        username: trip.username,
        startLocation: trip.startLocation,
        endLocation: trip.endLocation,
        chargingStations: trip.chargingStations,
        startTime: trip.startTime,
        endTime: trip.endTime,
        isCompleted: trip.isCompleted,
      });
    }
    res.status(200).json(response);
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
