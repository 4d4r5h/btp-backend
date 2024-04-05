window.LRM = {
  tileLayerURL: "http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  tomtomAccessToken: "jkf8G4nkI5HAHsFkJAom3KtGONAyLeuU",
  geocodeAccessToken: "65c4d79353aba676715416qfs3ff4fc",
  googleMapsAcessToken: "AIzaSyAZxtTN2ftb64eu3EGoYM8E9TOk1PhTxJ0",
  routificAccessToken:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NWM0ZmU3NGU1ZWU2YjAwMWI4YmQ2NjIiLCJpYXQiOjE3MDc0MDkwMTJ9.0Iif2yNAEZCC4TOCbtFR0xqhAND5FxnFPgxt704vOZo",
};

const defaultLatitude = 26.8467,
  defaultLongitude = 80.9462;
const defaultCoordinate = L.latLng(defaultLatitude, defaultLongitude);
let waypoints = [];
let markers = [];
let polylines = [];
let effectiveLengthOfWaypoints = 0;

const attribution =
  '&copy; <a href="https://about.google/brand-resource-center' +
  '/products-and-services/geo-guidelines/">Google Maps</a>';

const map = L.map("map", {
  inertia: true,
  dragging: true,
  center: defaultCoordinate,
  zoom: 15,
  zoomControl: false,
  attributionControl: true,
});

L.control
  .zoom({
    zoomInTitle: "Zoom In",
    zoomOutTitle: "Zoom Out",
  })
  .addTo(map);

L.tileLayer(LRM.tileLayerURL, {
  subdomains: ["mt0", "mt1", "mt2", "mt3"],
  opacity: 1.0,
  attribution: attribution,
}).addTo(map);

function giveLatsLngs(_waypoints) {
  let latsLngs = "";
  for (const coordinate of _waypoints) {
    if (coordinate !== null) {
      latsLngs += coordinate.lat + "," + coordinate.lng + ":";
    }
  }
  return latsLngs;
}

function giveTomTomURL(options) {
  const baseURL = "api.tomtom.com";
  const versionNumber = 1;
  const contentType = "json";
  const API_KEY = LRM.tomtomAccessToken;
  let routePlanningLocations = null;

  if (options.routePlanningLocations !== undefined) {
    routePlanningLocations = giveLatsLngs(options.routePlanningLocations);
  } else {
    routePlanningLocations = giveLatsLngs(waypoints);
  }

  let URL =
    `https://${baseURL}/routing/${versionNumber}/calculateRoute/` +
    `${routePlanningLocations}/${contentType}?key=${API_KEY}`;

  for (const key in options) {
    if (key !== "routePlanningLocations" && options.hasOwnProperty(key)) {
      URL += `&${key}=${options[key]}`;
    }
  }

  return URL;
}

async function fetchTomTomJSON(options) {
  let URL = giveTomTomURL(options);
  console.log(URL);
  const object = await fetch(URL);
  const json = await object.json();
  return json;
}

function showTrafficCongestion(routeArray) {
  const countOfRoutes = routeArray.length;
  const countOfDestinations = routeArray[0].route.length;
  const colors = ["green", "orange", "red"];

  for (let j = 0; j < countOfDestinations; j++) {
    let routes = [];
    for (let i = 0; i < countOfRoutes; i++) {
      routes.push({
        travelTimeInSeconds: routeArray[i].travelTimeInSeconds[j],
        lengthInMeters: routeArray[i].lengthInMeters[j],
        route: routeArray[i].route[j],
      });
    }
    routes.sort((object1, object2) => {
      return object1.travelTimeInSeconds - object2.travelTimeInSeconds;
    });

    for (let i = Math.min(2, countOfRoutes - 1); i >= 0; i--) {
      const content =
        `<b>Distance:</b> ${
          Math.round((routes[i].lengthInMeters / 100) * 100) / 1000
        } km` +
        `<br><b>Travel Time:</b> ${
          Math.round((routes[i].travelTimeInSeconds / 60) * 100) / 100
        } minutes`;
      polylines.push(
        L.polyline(routes[i].route, {
          color: colors[i],
        })
          .bindTooltip(content)
          .addTo(map)
      );
    }
  }
}

function clearPolylines() {
  for (let polyline of polylines) {
    polyline.remove();
  }
  polylines = [];
}

function showInstructions(routeArray) {
  const countOfRoutes = routeArray.length;
  const routes = [];

  for (let i = 0; i < countOfRoutes; i++) {
    let totalTravelTimeInSeconds = routeArray[i].travelTimeInSeconds.reduce(
      (x, y) => {
        return x + y;
      },
      0
    );
    routes.push({
      totalTravelTimeInSeconds: totalTravelTimeInSeconds,
      instructions: routeArray[i].instructions.messages,
    });
  }
  routes.sort((object1, object2) => {
    return object1.totalTravelTimeInSeconds - object2.totalTravelTimeInSeconds;
  });

  let instructions = "";

  for (let i = 0; i < routes[0].instructions.length; i++) {
    const instruction =
      (1 + i).toString(10) + ": " + routes[0].instructions[i] + ". <br>";
    instructions += instruction;
  }

  outputTextBox = document.getElementsByClassName("output-text-box")[0];
  outputTextBox.style.visibility = "visible";
  outputTextBox.innerHTML = instructions;
}

function doRouting(options) {
  fetchTomTomJSON(options).then((json) => {
    const countOfRoutes = json.routes.length;
    const routeArray = [];
    for (let i = 0; i < countOfRoutes; i++) {
      const legs = json.routes[i].legs;
      const guidance = json.routes[i].guidance;
      const countOfDestinations = legs.length;
      const countOfInstructions = guidance.instructions.length;
      let route = [];
      let instructions = { messages: [] };
      let travelTimeInSeconds = [];
      let lengthInMeters = [];
      for (let j = 0; j < countOfDestinations; j++) {
        const points = legs[j].points.map((object) => {
          return [object.latitude, object.longitude];
        });
        route.push(points);
        travelTimeInSeconds.push(legs[j].summary.travelTimeInSeconds);
        lengthInMeters.push(legs[j].summary.lengthInMeters);
      }
      for (let j = 0; j < countOfInstructions; j++) {
        const message = guidance.instructions[j].message;
        instructions.messages.push(message);
      }
      routeArray[i] = {
        index: i,
        travelTimeInSeconds: travelTimeInSeconds,
        lengthInMeters: lengthInMeters,
        route: route,
        instructions: instructions,
      };
    }
    showInstructions(routeArray);
    showTrafficCongestion(routeArray);
  });
}

function showTrafficCongestionForVRP(routeArray) {
  const countOfRoutes = routeArray.length;
  const countOfDestinations = 1;
  const colors = ["green", "orange", "red"];

  const content =
    `<b>Distance:</b> ${
      Math.round((routeArray.lengthInMeters[0] / 100) * 100) / 1000
    } km` +
    `<br><b>Travel Time:</b> ${
      Math.round((routeArray.travelTimeInSeconds[0] / 60) * 100) / 100
    } minutes`;
  const countOfPolylines = polylines.length;
  polylines.push(
    L.polyline(routeArray.route, {
      color: colors[countOfPolylines],
    })
      .bindTooltip(content)
      .addTo(map)
  );

  // for (let j = 0; j < countOfDestinations; j++) {
  //   let routes = [];
  //   for (let i = 0; i < countOfRoutes; i++) {
  //     routes.push({
  //       travelTimeInSeconds: routeArray[i].travelTimeInSeconds[j],
  //       lengthInMeters: routeArray[i].lengthInMeters[j],
  //       route: routeArray[i].route[j],
  //     });
  //   }
  // routes.sort((object1, object2) => {
  //   return object1.travelTimeInSeconds - object2.travelTimeInSeconds;
  // });

  // for (let i = Math.min(2, countOfRoutes - 1); i >= 0; i--) {
  //   const content =
  //     `<b>Distance:</b> ${
  //       Math.round((routes[i].lengthInMeters / 100) * 100) / 1000
  //     } km` +
  //     `<br><b>Travel Time:</b> ${
  //       Math.round((routes[i].travelTimeInSeconds / 60) * 100) / 100
  //     } minutes`;
  //     const countOfPolylines = polylines.length;
  //   polylines.push(
  //     L.polyline(routes[i].route, {
  //       color: colors[countOfPolylines],
  //     })
  //       .bindTooltip(content)
  //       .addTo(map)
  //   );
  // }
}

function doRoutingForVRP(options) {
  fetchTomTomJSON(options).then((json) => {
    const countOfRoutes = json.routes.length;
    const routeArray = [];
    for (let i = 0; i < countOfRoutes; i++) {
      const legs = json.routes[i].legs;
      const guidance = json.routes[i].guidance;
      const countOfDestinations = legs.length;
      const countOfInstructions = guidance.instructions.length;
      let route = [];
      let instructions = { messages: [] };
      let travelTimeInSeconds = [];
      let lengthInMeters = [];
      for (let j = 0; j < countOfDestinations; j++) {
        const points = legs[j].points.map((object) => {
          return [object.latitude, object.longitude];
        });
        for (let point of points) {
          route.push(point);
        }
      }
      for (let j = 0; j < countOfInstructions; j++) {
        const message = guidance.instructions[j].message;
        instructions.messages.push(message);
      }
      travelTimeInSeconds.push(json.routes[i].summary.travelTimeInSeconds);
      lengthInMeters.push(json.routes[i].summary.lengthInMeters);
      routeArray[i] = {
        index: i,
        travelTimeInSeconds: travelTimeInSeconds,
        lengthInMeters: lengthInMeters,
        route: route,
        instructions: instructions,
      };
      // console.log(routeArray[i]);
      showTrafficCongestionForVRP(routeArray[i]);
    }
    // showInstructions(routeArray);
  });
}

function giveRoutificData(options) {
  const visits = {};
  const fleet = {};
  const countOfVehicles = 3;
  const _waypoints = [];

  for (coordinate of waypoints) {
    if (coordinate !== null) _waypoints.push(coordinate);
  }

  for (let i = 1; i < _waypoints.length; i++) {
    visits[`order_${i}`] = {
      location: _waypoints[i],
    };
  }
  for (let i = 0; i < countOfVehicles; i++) {
    fleet[`vehicle_${i + 1}`] = {
      start_location: _waypoints[0],
    };
  }

  const data = {
    visits: visits,
    fleet: fleet,
    options: options,
  };
  return data;
}

async function fetchRoutificJSON(options) {
  const API_KEY = LRM.routificAccessToken;
  let URL = "https://api.routific.com/v1/vrp";
  const data = giveRoutificData(options);
  const object = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });
  const json = await object.json();
  return { json: json, data: data };
}

function doVRP(options) {
  fetchRoutificJSON(options).then((object) => {
    const json = object.json;
    const data = object.data;
    if (json.status === "success") {
      const allVehicles = json.solution;
      for (let vehicle in allVehicles) {
        const _waypoints = [];
        for (let path of allVehicles[vehicle]) {
          let name = path.location_name;
          if (name.endsWith("_start"))
            name = name.substring(0, name.indexOf("_start"));
          let coordinate;
          for (let vehicle in data.fleet) {
            if (vehicle == name) {
              coordinate = data.fleet[vehicle].start_location;
            }
          }
          for (let order in data.visits) {
            if (order == name) {
              coordinate = data.visits[order].location;
            }
          }
          _waypoints.push(coordinate);
        }
        if (_waypoints.length > 1) {
          doRoutingForVRP({
            routePlanningLocations: _waypoints,
            instructionsType: "tagged",
          });
        }
      }
    }
  });
}

function routing() {
  clearPolylines();
  clearOutputTextBox();
  if (effectiveLengthOfWaypoints > 1) {
    doRouting({
      maxAlternatives: 2,
      instructionsType: "tagged",
    });
    // doVRP({});
  }
}

async function geocode(coordinate) {
  const latitude = coordinate.lat;
  const longitude = coordinate.lng;
  const API_KEY = LRM.geocodeAccessToken;
  const URL = `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}&api_key=${API_KEY}`;
  const object = await fetch(URL, {
    mode: "cors",
  });
  const json = await object.json();
  return json;
}

function getTextInputByNumber(number) {
  return document.getElementById("input" + number);
}

function findParentByClass(element, className) {
  while (element && !element.classList.contains(className)) {
    element = element.parentNode;
  }
  return element;
}

function clearTextBox(id) {
  let inputElement = document.getElementById(`input${id}`);
  let formParent = findParentByClass(inputElement, "form");
  if (formParent) {
    formParent.remove();
  }
  waypoints[id - 1] = null;
  effectiveLengthOfWaypoints--; // keep these two statements above remove()
  const temporary = markers[id - 1];
  markers[id - 1] = null;
  temporary.remove();
}

function clearOutputTextBox() {
  outputTextBox = document.getElementsByClassName("output-text-box")[0];
  outputTextBox.style.visibility = "hidden";
  outputTextBox.innerHTML = "";
}

function fillTextInput() {
  const lengthOfWaypoints = waypoints.length;
  const inputContainer = document.getElementsByClassName("input-container")[0];
  geocode(waypoints[lengthOfWaypoints - 1]).then((json) => {
    const address = json.display_name;
    let newTextInput = `<div class="form"> <input type="text" class="text-input" value="${address}" id="input${lengthOfWaypoints}" />`;
    let clearButton = `<div class="clear-button" onclick="clearTextBox('${lengthOfWaypoints}')">x</div>`;
    newTextInput += clearButton + `</div>`;
    inputContainer.innerHTML += newTextInput;
  });
}

function addMarker(coordinate) {
  console.log(coordinate);
  const lengthOfWaypoints = waypoints.length;
  const marker = L.marker(coordinate, {
    draggable: true,
    icon: L.icon.glyph({ glyph: effectiveLengthOfWaypoints }),
  });

  let moveEventObject = null;
  marker.on("move", (e) => {
    moveEventObject = e;
  });
  marker.on("moveend", () => {
    let textInputNumber = null;
    const coordinate = moveEventObject.oldLatLng;
    for (let i = 0; i < waypoints.length; i++) {
      if (waypoints[i] !== null && coordinate === waypoints[i]) {
        textInputNumber = i + 1;
        break;
      }
    }
    const textInput = getTextInputByNumber(textInputNumber);
    geocode(moveEventObject.latlng).then((json) => {
      const address = json.display_name;
      textInput.value = address;
    });
    waypoints[textInputNumber - 1] = moveEventObject.latlng;
    routing();
  });

  marker.on("remove", (e) => {
    let counter = 1;
    for (let marker of markers) {
      if (marker !== null) {
        marker.setIcon(L.icon.glyph({ glyph: counter }));
        counter++;
      }
    }

    routing();
  });

  marker.addTo(map);
  markers[lengthOfWaypoints - 1] = marker;
}

map
  .locate()
  .on("locationfound", (e) => {
    const currentCoordinate = e.latlng;
    waypoints.push(currentCoordinate);
    effectiveLengthOfWaypoints++;
    map.setView(currentCoordinate);
    addMarker(currentCoordinate);
    const circle = L.circle(currentCoordinate, { radius: e.accuracy });
    circle.addTo(map);
    fillTextInput();
  })
  .on("locationerror", (e) => {
    alert(e.message);
  });

map.on("click", (e) => {
  const coordinate = e.latlng;
  waypoints.push(coordinate);
  effectiveLengthOfWaypoints++;
  fillTextInput();
  addMarker(coordinate);

  routing();
});

document.getElementById("add_label_button").addEventListener("click", () => {
  window.location.href = "add_label.html";
});

document.getElementById("recenter_button").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const coordinate = L.latLng(
        position.coords.latitude,
        position.coords.longitude
      );
      map.panTo(coordinate, {
        duration: 0.25,
        animate: true,
      });
      map.flyTo(coordinate, 15, {
        animate: true,
        duration: 1,
      });
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }
});

document.getElementById("speak_button").addEventListener("click", () => {
  const text = document.getElementsByClassName("output-text-box")[0].innerHTML;

  function speak(text, rate, pitch, volume) {
    let speakData = new SpeechSynthesisUtterance();
    speakData.volume = volume;
    speakData.rate = rate;
    speakData.pitch = pitch;
    speakData.text = text;
    speakData.lang = "en";
    speechSynthesis.speak(speakData);
  }

  if ("speechSynthesis" in window) {
    let rate = 1;
    let pitch = 2;
    let volume = 1;
    speak(text, rate, pitch, volume);
  } else {
    console.log("Your browser doesn't support Speech Synthesis feature!");
  }
});

function addLabel() {
  if (sessionStorage.length > 1) {
    for (let key in sessionStorage) {
      if (key.startsWith('{"latitude":')) {
        const description = sessionStorage[key];
        let coordinate = JSON.parse(key);
        coordinate = L.latLng(coordinate.latitude, coordinate.longitude);
        console.log(description);
        console.log(coordinate);
        L.marker(coordinate, {
          title: description,
        }).addTo(map);
      }
    }
  }
}

addLabel();
