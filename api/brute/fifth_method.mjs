import { fetchDistanceAndTime, fetchDistanceAndTimeMatrix } from "../fetch.mjs";
import PriorityQueue from "priorityqueuejs";

export default async function findOptimalPath(request) {
  let distanceAndTimeMatrix = new Map();

  async function getDistanceAndTime(point1, point2) {
    try {
      const key = JSON.stringify([point1, point2]);
      if (distanceAndTimeMatrix.has(key)) {
        return distanceAndTimeMatrix.get(key);
      }
      const json = await fetchDistanceAndTime([point1, point2]);
      if (!json.hasOwnProperty("data")) {
        throw {
          name: "InvalidResponseError",
          message:
            "The response does not contain the expected 'data' property.",
        };
      }
      const distance = json.data[0].routeSummary.lengthInMeters;
      const distanceInKilometers = Math.round((distance / 1000) * 1000) / 1000;
      const time = json.data[0].routeSummary.travelTimeInSeconds;
      const timeinHours = Math.round((time / 3600) * 1000) / 1000;
      const value = { distance: distanceInKilometers, time: timeinHours };
      distanceAndTimeMatrix.set(key, value);
      return value;
    } catch (error) {
      throw error;
    }
  }

  async function getDistanceAndTimeMatrix(
    origins,
    destinations,
    distanceAndTimeMatrix
  ) {
    try {
      const json = await fetchDistanceAndTimeMatrix(origins, destinations);
      if (!json.hasOwnProperty("data")) {
        throw {
          name: "InvalidResponseError",
          message:
            "The response does not contain the expected 'data' property.",
        };
      }
      for (let i = 0; i < origins.length; i++) {
        for (let j = 0; j < destinations.length; j++) {
          const index = i * destinations.length + j;
          const distance = json.data[index].routeSummary.lengthInMeters;
          const distanceInKilometers =
            Math.round((distance / 1000) * 1000) / 1000;
          const time = json.data[index].routeSummary.travelTimeInSeconds;
          const timeinHours = Math.round((time / 3600) * 1000) / 1000;
          const key = JSON.stringify([origins[i], destinations[j]]);
          const value = { distance: distanceInKilometers, time: timeinHours };
          distanceAndTimeMatrix.set(key, value);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  const {
    waypoints,
    initialBatteryCharge,
    fullBatteryChargeCapacity,
    dischargingRate,
    chargingRate,
    chargingStations,
  } = request;
  const priorityQueue = new PriorityQueue((a, b) => {
    return b.totalTime - a.totalTime;
  });

  try {
    const allWaypoints = waypoints.concat(
      chargingStations.map((chargingStation) => chargingStation.location)
    );
    await getDistanceAndTimeMatrix(
      allWaypoints,
      allWaypoints,
      distanceAndTimeMatrix
    );
  } catch (error) {
    throw error;
  }

  function calculateHeuristic(point1, point2) {
    const dx = point1.latitude - point2.latitude;
    const dy = point1.longitude - point2.longitude;
    const speed = 0.01;
    return Math.sqrt(dx * dx + dy * dy) * (110.0 / speed);
  }

  priorityQueue.enq({
    currentLocation: waypoints[0],
    indexOfNextTargetLocation: 1,
    totalTime: calculateHeuristic(
      waypoints[0],
      waypoints[waypoints.length - 1]
    ),
    currentBatteryCharge: initialBatteryCharge,
    path: [waypoints[0]],
    stations: [],
    time: [],
  });

  while (priorityQueue.size() > 0) {
    let {
      currentLocation,
      indexOfNextTargetLocation,
      totalTime,
      currentBatteryCharge,
      path,
      stations,
      time,
    } = priorityQueue.deq();

    totalTime -= calculateHeuristic(
      currentLocation,
      waypoints[waypoints.length - 1]
    );

    if (indexOfNextTargetLocation == waypoints.length) {
      return { path: path, stations: stations, time: time };
    }

    for (const chargingStation of chargingStations) {
      const { location, reservedFrom, reservedTill } = chargingStation;
      if (location === currentLocation || reservedFrom != null) continue;
      try {
        const json = await getDistanceAndTime(currentLocation, location);
        const distance = json.distance;
        let duration = {
          startTime: 0,
          endTime: 0,
        };
        let newTotalTime = json.time + totalTime;
        duration.startTime = newTotalTime;

        if (distance * dischargingRate < currentBatteryCharge) {
          let newCurrentBatteryCharge =
            currentBatteryCharge - distance * dischargingRate;
          const chargingTime =
            (fullBatteryChargeCapacity - newCurrentBatteryCharge) /
            chargingRate;
          newTotalTime += chargingTime;
          duration.endTime = newTotalTime;
          newCurrentBatteryCharge = fullBatteryChargeCapacity;

          newTotalTime += calculateHeuristic(
            location,
            waypoints[waypoints.length - 1]
          );

          priorityQueue.enq({
            currentLocation: location,
            indexOfNextTargetLocation: indexOfNextTargetLocation,
            totalTime: newTotalTime,
            currentBatteryCharge: newCurrentBatteryCharge,
            path: [...path, location],
            stations: [...stations, location],
            time: [...time, duration],
          });
        }
      } catch (error) {
        console.log({
          error: {
            name: error.name,
            message: error.message,
          },
        });
      }
    }

    try {
      const newCurrentLocation = waypoints[indexOfNextTargetLocation];
      const json = await getDistanceAndTime(
        currentLocation,
        newCurrentLocation
      );

      const distance = json.distance;
      let newTotalTime = json.time + totalTime;

      if (distance * dischargingRate < currentBatteryCharge) {
        const newCurrentBatteryCharge =
          currentBatteryCharge - distance * dischargingRate;

        newTotalTime += calculateHeuristic(
          newCurrentLocation,
          waypoints[waypoints.length - 1]
        );

        priorityQueue.enq({
          currentLocation: newCurrentLocation,
          indexOfNextTargetLocation: indexOfNextTargetLocation + 1,
          totalTime: newTotalTime,
          currentBatteryCharge: newCurrentBatteryCharge,
          path: [...path, newCurrentLocation],
          stations: stations,
          time: time,
        });
      }
    } catch (error) {
      console.log({
        error: {
          name: error.name,
          message: error.message,
        },
      });
    }
  }

  return { path: [], stations: [], time: [] };
}
