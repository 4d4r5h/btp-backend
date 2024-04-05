import { fetchTomTomJSON } from "./fetch.mjs";
import findOptimalPath from "./find_optimal_path.mjs";

export default function routing(request) {
  return new Promise(async (resolve, reject) => {
    async function getPath(waypoints) {
      try {
        const json = await fetchTomTomJSON(waypoints);
        if (!json.hasOwnProperty("routes")) {
          return [];
        }
        const legs = json.routes[0].legs;
        const totalLengthInMeters = json.routes[0].summary.lengthInMeters;
        const totalTravelTimeInSeconds = json.routes[0].summary.travelTimeInSeconds;
        let path = [];
        for (const leg of legs) {
          path = path.concat(leg.points);
        }
        return [path, totalLengthInMeters, totalTravelTimeInSeconds];
      } catch (error) {
        reject(error);
      }
    }
    let response = { path: [], stations: [], time: [] };
    try {
      const json = await findOptimalPath(request);
      const waypoints = json.path;
      const stations = json.stations;
      const time = json.time;
      if (waypoints.length >= 2) {
        const array = await getPath(waypoints);
        response.path = array[0];
        if (response.path.length > 0) {
          response.stations = stations;
          response.time = time;
          response.totalLengthInMeters = array[1];
          response.totalTravelTimeInSeconds = array[2];
        }
      }
      resolve(response);
    } catch (error) {
      reject(error);
    }
  });
}
