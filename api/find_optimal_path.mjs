import { fetchDistanceAndTime, fetchDistanceAndTimeMatrix } from "./fetch.mjs";
// import PriorityQueue from "priorityqueuejs";

export default async function findOptimalPath(request) {
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
      return { distance: distanceInKilometers, time: timeinHours };
    } catch (error) {
      throw error;
    }
  }

  async function getDistanceAndTimeMatrix(origins, destinations) {
    try {
      const json = await fetchDistanceAndTimeMatrix(origins, destinations);
      if (!json.hasOwnProperty("data")) {
        throw {
          name: "InvalidResponseError",
          message:
            "The response does not contain the expected 'data' property.",
        };
      }
      let distanceAndTimeMatrix = new Map();
      for (let i = 0; i < origins.length; i++) {
        for (let j = 0; j < destinations.length; j++) {
          const index = i * destinations.length + j;
          const distance = json.data[index].routeSummary.lengthInMeters;
          const distanceInKilometers =
            Math.round((distance / 1000) * 1000) / 1000;
          const time = json.data[index].routeSummary.travelTimeInSeconds;
          const timeinHours = Math.round((time / 3600) * 1000) / 1000;
          const key = [origins[i], destinations[j]];
          const value = { distance: distanceInKilometers, time: timeinHours };
          distanceAndTimeMatrix.set(JSON.stringify(key), value);
        }
      }
      return distanceAndTimeMatrix;
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
  let priorityQueue = [];
  let distanceAndTimeMatrix = [];

  try {
    const allWaypoints = waypoints.concat(
      chargingStations.map((chargingStation) => chargingStation.location)
    );
    distanceAndTimeMatrix = await getDistanceAndTimeMatrix(
      allWaypoints,
      allWaypoints
    );
  } catch (error) {
    throw error;
  }

  priorityQueue.push({
    currentLocation: waypoints[0],
    indexOfNextTargetLocation: 1,
    totalTime: 0,
    currentBatteryCharge: initialBatteryCharge,
    path: [waypoints[0]],
    stations: [],
    time: [],
  });

  while (priorityQueue.length > 0) {
    priorityQueue.sort((a, b) => {
      return a.totalTime - b.totalTime;
    });

    const {
      currentLocation,
      indexOfNextTargetLocation,
      totalTime,
      currentBatteryCharge,
      path,
      stations,
      time,
    } = priorityQueue.shift();

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
          const newCurrentLocation = location;
          const newPath = path.concat(newCurrentLocation);
          const newIndexOfNextTargetLocation = indexOfNextTargetLocation;
          const newStations = stations.concat(location);
          const newTime = time.concat(duration);

          priorityQueue.push({
            currentLocation: newCurrentLocation,
            indexOfNextTargetLocation: newIndexOfNextTargetLocation,
            totalTime: newTotalTime,
            currentBatteryCharge: newCurrentBatteryCharge,
            path: newPath,
            stations: newStations,
            time: newTime,
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
      const json = await getDistanceAndTime(
        currentLocation,
        waypoints[indexOfNextTargetLocation]
      );

      const distance = json.distance;
      let newTotalTime = json.time + totalTime;

      if (distance * dischargingRate < currentBatteryCharge) {
        const newCurrentBatteryCharge =
          currentBatteryCharge - distance * dischargingRate;
        const newCurrentLocation = waypoints[indexOfNextTargetLocation];
        const newPath = path.concat(newCurrentLocation);
        const newIndexOfNextTargetLocation = indexOfNextTargetLocation + 1;
        const newStations = stations;
        const newTime = time;

        priorityQueue.push({
          currentLocation: newCurrentLocation,
          indexOfNextTargetLocation: newIndexOfNextTargetLocation,
          totalTime: newTotalTime,
          currentBatteryCharge: newCurrentBatteryCharge,
          path: newPath,
          stations: newStations,
          time: newTime,
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
