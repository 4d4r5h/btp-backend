import fetch from "node-fetch";

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
  "DlAiWnq2AbXQZ1jvOohJbj4kHD1tFzee",
];

const tomtomAccessToken = "BcBXIT6iI7iGcl7VhKG5oQW0AJgkR5bn";

function generateTomTomURL(waypoints) {
  const baseURL = "api.tomtom.com";
  const versionNumber = 1;
  const contentType = "json";
  const API_KEY = tomtomAccessToken;
  let routePlanningLocations = "";

  for (const coordinate of waypoints) {
    if (coordinate !== null) {
      routePlanningLocations +=
        coordinate.latitude + "," + coordinate.longitude + ":";
    }
  }

  let URL =
    `https://${baseURL}/routing/${versionNumber}/calculateRoute/` +
    `${routePlanningLocations}/${contentType}?key=${API_KEY}`;

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
  const URL = `https://api.tomtom.com/routing/matrix/2?key=${tomtomAccessToken}`;
  console.log(
    `Fetching Distance and Time between ${waypoints[0].latitude}, ${waypoints[0].longitude} and ${waypoints[1].latitude}, ${waypoints[1].longitude}.`
  );
  const payload = {
    origins: [
      {
        point: waypoints[0],
      },
    ],
    destinations: [
      {
        point: waypoints[1],
      },
    ],
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
  const URL = `https://api.tomtom.com/routing/matrix/2?key=${tomtomAccessToken}`;
  const _origins = origins.map((point) => ({
    point: {
      latitude: point.latitude,
      longitude: point.longitude,
    },
  }));
  const _destinations = destinations.map((point) => ({
    point: {
      latitude: point.latitude,
      longitude: point.longitude,
    },
  }));
  const payload = {
    origins: _origins,
    destinations: _destinations,
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
