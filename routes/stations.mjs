import express from "express";
import Stations from "../models/stations.mjs";

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

router.post("/add_stations", async (req, res) => {
  try {
    let { label, location } = req.body;
    label = label.trim();
    const latitude = parseFloat(location.latitude);
    const longitude = parseFloat(location.longitude);
    if (!isValidLocation(latitude, longitude)) {
      return res.status(400).json({
        error: {
          name: "InvalidLocationError",
          message: "Invalid latitude or longitude values.",
        },
      });
    }
    const existingStation = await Stations.findOne({
      "location.latitude": latitude,
      "location.longitude": longitude,
    }).lean();
    if (existingStation) {
      return res.status(400).json({
        error: {
          name: "DuplicateLocationError",
          message:
            "A station with the same latitude and longitude already exists.",
        },
      });
    }
    const request = {
      label: label,
      location: {
        latitude: latitude,
        longitude: longitude,
      },
    };
    const station = new Stations(request);
    await station.save();
    const response = {
      id: station._id,
      label: station.label,
      location: station.location,
    };
    res.status(200).json(response);
    console.log("A new charging station has been added successfully.");
  } catch (error) {
    res.status(500).json({
      error: {
        name: error.name,
        message: error.message,
      },
    });
  }
});

router.get("/show_stations", async (req, res) => {
  try {
    const stations = await Stations.find().lean();
    const response = stations.map((station) => ({
      id: station._id,
      label: station.label,
      location: station.location,
      reservedFrom: station.reservedFrom,
      reservedTill: station.reservedTill,
    }));
    res.status(200).json(response);
    response.length = 0;
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
