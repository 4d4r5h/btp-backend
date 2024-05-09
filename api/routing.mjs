import { fetchTomTomJSON } from "./fetch.mjs";
import findOptimalPath from "./find_optimal_path.mjs";
// import findOptimalPath from "./brute/fourth_method.mjs";

export default async function routing(request) {
  async function getPath(waypoints) {
    try {
      let json = await fetchTomTomJSON(waypoints);
      if (!json.hasOwnProperty("routes")) {
        json = null;
        return [[], 0, 0];
      }
      const legs = json.routes[0].legs;
      const totalLengthInMeters = json.routes[0].summary.lengthInMeters;
      const totalTravelTimeInSeconds =
        json.routes[0].summary.travelTimeInSeconds;
      let path = [];
      for (const leg of legs) {
        path.push(...leg.points);
      }
      json = null;
      return [path, totalLengthInMeters, totalTravelTimeInSeconds];
    } catch (error) {
      throw error;
    }
  }

  try {
    let json = await findOptimalPath(request);
    const waypoints = json.path;
    const stations = json.stations;
    const time = json.time;
    json = null;
    if (waypoints.length >= 2) {
      const [path, totalLengthInMeters, totalTravelTimeInSeconds] =
        await getPath(waypoints);
      if (path.length > 0) {
        return {
          path,
          stations,
          time,
          totalLengthInMeters,
          totalTravelTimeInSeconds,
        };
      }
    }
    return {
      path: [],
      stations: [],
      time: [],
    };
  } catch (error) {
    throw error;
  }
}
