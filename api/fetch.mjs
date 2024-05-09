import { Mutex } from "async-mutex";

class TokenManager {
  constructor(tokens, maxUsage) {
    this.tokens = tokens;
    this.maxUsage = maxUsage;
    this.usageCounts = Array(tokens.length).fill(0);
    this.currentIndex = 0;
    this.mutex = new Mutex();
  }

  async getCurrentToken() {
    return await this.mutex.runExclusive(async () => {
      while (
        this.currentIndex < this.tokens.length &&
        this.usageCounts[this.currentIndex] >= this.maxUsage
      ) {
        this.currentIndex = this.currentIndex + 1;
      }
      if (this.currentIndex == this.tokens.length) {
        this.usageCounts.fill(0);
        this.currentIndex = 0;
      }
      this.usageCounts[this.currentIndex] += 1;
      return this.tokens[this.currentIndex];
    });
  }
}

const tokens = [
  "rEtgPAC2uAWWms3IDgf0PVfNFb059s2R",
  "jkf8G4nkI5HAHsFkJAom3KtGONAyLeuU",
  "BcBXIT6iI7iGcl7VhKG5oQW0AJgkR5bn",
  "PJYbeGLfUeXRUroXELNWYnNYCbm5rnXJ",
  "hBk7N1sgQ6oVAdACcDITkV22enZCsdWy",
  "ClYZh1pP6EknjeGtXqOafGnA4I5MGkan",
  "YY7JdsJXQh2xOQbu7WkxBEUoojZi0ZQA",
  "M5HNXGRcVM04mjQVuwmlNWWsTS0V4BLM",
  "mLMFHhbGIqlfyoIGtvmZcG7UeMa2mair",
  "SxqXuvaY9VWN6GupAWAahooLqTl8ohA2",
  "G5c2JgJktCipaANFth3JTVYc3bPoKSEX",
  "yO4ACcpiV0KSjsBiMWoZXF5UGBHcJwxk",
  "x3eEC5jGIc6YacX91bGpcA72xVquZX7V",
  "KtCoevkTV3HhwPARccC7v5AVQtOIQAyc",
  "bOnv6OAzFU4hnChRl6oFlAJVVSfaGg5A",
];
const maxUsage = 10;
const tomtomAccessToken = "DlAiWnq2AbXQZ1jvOohJbj4kHD1tFzee";

const tokenManager = new TokenManager(tokens, maxUsage);

function generateTomTomURL(waypoints) {
  const baseURL = "api.tomtom.com";
  const versionNumber = 1;
  const contentType = "json";
  const API_KEY = tomtomAccessToken;

  const routePlanningLocations = waypoints
    .filter((coordinate) => coordinate !== null)
    .map((coordinate) => `${coordinate.latitude},${coordinate.longitude}`)
    .join(":");

  const URL = `https://${baseURL}/routing/${versionNumber}/calculateRoute/${routePlanningLocations}/${contentType}?key=${API_KEY}`;

  return URL;
}

export const fetchTomTomJSON = async (waypoints) => {
  const URL = generateTomTomURL(waypoints);
  console.log(URL);
  try {
    const response = await fetch(URL);
    const json = await response.json();
    return json;
  } catch (error) {
    throw error;
  }
};

export const fetchDistanceAndTime = async (waypoints) => {
  const token = await tokenManager.getCurrentToken();
  const URL = `https://api.tomtom.com/routing/matrix/2?key=${token}`;
  console.log(
    `Fetching Distance and Time between ${waypoints[0].latitude}, ${waypoints[0].longitude} and ${waypoints[1].latitude}, ${waypoints[1].longitude}.`
  );
  const payload = {
    origins: [{ point: waypoints[0] }],
    destinations: [{ point: waypoints[1] }],
    options: {
      departAt: "now",
      traffic: "live",
    },
  };
  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    return json;
  } catch (error) {
    throw error;
  }
};

export const fetchDistanceAndTimeMatrix = async (origins, destinations) => {
  const token = await tokenManager.getCurrentToken();
  const URL = `https://api.tomtom.com/routing/matrix/2?key=${token}`;
  console.log(URL);
  const payload = {
    origins: origins.map((point) => ({
      point: { latitude: point.latitude, longitude: point.longitude },
    })),
    destinations: destinations.map((point) => ({
      point: { latitude: point.latitude, longitude: point.longitude },
    })),
    options: {
      departAt: "now",
      traffic: "live",
    },
  };

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    // const data =
    //   '{"data":[{"originIndex":0,"destinationIndex":0,"routeSummary":{"lengthInMeters":0,"travelTimeInSeconds":0,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T20:58:38+05:30"}},{"originIndex":0,"destinationIndex":1,"routeSummary":{"lengthInMeters":47977,"travelTimeInSeconds":3319,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:53:57+05:30"}},{"originIndex":0,"destinationIndex":2,"routeSummary":{"lengthInMeters":27486,"travelTimeInSeconds":2766,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:44:43+05:30"}},{"originIndex":0,"destinationIndex":3,"routeSummary":{"lengthInMeters":6743,"travelTimeInSeconds":1321,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:20:38+05:30"}},{"originIndex":0,"destinationIndex":4,"routeSummary":{"lengthInMeters":7544,"travelTimeInSeconds":1014,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:15:32+05:30"}},{"originIndex":1,"destinationIndex":0,"routeSummary":{"lengthInMeters":47990,"travelTimeInSeconds":3313,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:53:50+05:30"}},{"originIndex":1,"destinationIndex":1,"routeSummary":{"lengthInMeters":0,"travelTimeInSeconds":0,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T20:58:38+05:30"}},{"originIndex":1,"destinationIndex":2,"routeSummary":{"lengthInMeters":22532,"travelTimeInSeconds":1645,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:26:02+05:30"}},{"originIndex":1,"destinationIndex":3,"routeSummary":{"lengthInMeters":43898,"travelTimeInSeconds":3043,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:49:20+05:30"}},{"originIndex":1,"destinationIndex":4,"routeSummary":{"lengthInMeters":54563,"travelTimeInSeconds":3494,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:56:51+05:30"}},{"originIndex":2,"destinationIndex":0,"routeSummary":{"lengthInMeters":27156,"travelTimeInSeconds":2932,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:47:29+05:30"}},{"originIndex":2,"destinationIndex":1,"routeSummary":{"lengthInMeters":22506,"travelTimeInSeconds":1643,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:26:00+05:30"}},{"originIndex":2,"destinationIndex":2,"routeSummary":{"lengthInMeters":0,"travelTimeInSeconds":0,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T20:58:38+05:30"}},{"originIndex":2,"destinationIndex":3,"routeSummary":{"lengthInMeters":23064,"travelTimeInSeconds":2657,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:42:55+05:30"}},{"originIndex":2,"destinationIndex":4,"routeSummary":{"lengthInMeters":33729,"travelTimeInSeconds":3119,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:50:37+05:30"}},{"originIndex":3,"destinationIndex":0,"routeSummary":{"lengthInMeters":6743,"travelTimeInSeconds":1265,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:19:43+05:30"}},{"originIndex":3,"destinationIndex":1,"routeSummary":{"lengthInMeters":43885,"travelTimeInSeconds":3002,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:48:40+05:30"}},{"originIndex":3,"destinationIndex":2,"routeSummary":{"lengthInMeters":23394,"travelTimeInSeconds":2454,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:39:31+05:30"}},{"originIndex":3,"destinationIndex":3,"routeSummary":{"lengthInMeters":0,"travelTimeInSeconds":0,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T20:58:38+05:30"}},{"originIndex":3,"destinationIndex":4,"routeSummary":{"lengthInMeters":12988,"travelTimeInSeconds":1666,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:26:24+05:30"}},{"originIndex":4,"destinationIndex":0,"routeSummary":{"lengthInMeters":7544,"travelTimeInSeconds":1027,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:15:44+05:30"}},{"originIndex":4,"destinationIndex":1,"routeSummary":{"lengthInMeters":54018,"travelTimeInSeconds":3650,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:59:27+05:30"}},{"originIndex":4,"destinationIndex":2,"routeSummary":{"lengthInMeters":33158,"travelTimeInSeconds":3116,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:50:33+05:30"}},{"originIndex":4,"destinationIndex":3,"routeSummary":{"lengthInMeters":12988,"travelTimeInSeconds":1733,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T21:27:31+05:30"}},{"originIndex":4,"destinationIndex":4,"routeSummary":{"lengthInMeters":0,"travelTimeInSeconds":0,"trafficDelayInSeconds":0,"departureTime":"2024-05-07T20:58:38+05:30","arrivalTime":"2024-05-07T20:58:38+05:30"}}],"statistics":{"totalCount":25,"successes":25,"failures":0}}';
    // const json = JSON.parse(data);
    return json;
  } catch (error) {
    throw error;
  }
};
