import axios from "axios";

const payload = {
  waypoints: [
    { latitude: 25.540789, longitude: 84.850905 },
    { latitude: 25.58351898737865, longitude: 84.46072574704885 },
  ],
  initialBatteryCharge: 9999,
};

// const startTimeSingle = Date.now();

// axios
//   .post("http://localhost:3000/api", payload)
//   .then((response) => {
//     const endTimeSingle = Date.now();
//     const timeTakenSingle = endTimeSingle - startTimeSingle;
//     console.log(`Single request: Time taken - ${timeTakenSingle} ms`);
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });

const numUsers = 3;
const startTimeConcurrent = Date.now();
const requests = [];

for (let i = 0; i < numUsers; i++) {
  requests.push(
    axios.post("http://localhost:3000/api", payload).catch((error) => {
      console.error(`User ${i + 1}: Error -`, error);
    })
  );
}

Promise.all(requests)
  .then(() => {
    const endTimeConcurrent = Date.now();
    const timeTakenConcurrent = endTimeConcurrent - startTimeConcurrent;
    console.log(`Concurrent request: Time taken - ${timeTakenConcurrent} ms`);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
