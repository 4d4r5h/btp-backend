function play() {
  const latitude = document.getElementById("latitude").value;
  const longitude = document.getElementById("longitude").value;
  const description = document.getElementById("description").value;
  json = {
    latitude: latitude,
    longitude: longitude,
  };
  sessionStorage.setItem(JSON.stringify(json), description);
  alert("Label has been successfully added to the map.");
}
