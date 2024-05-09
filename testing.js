import axios from "axios";

// const payload = {
//   waypoints: [
//     { latitude: 25.540789, longitude: 84.850905 },
//     { latitude: 25.58351898737865, longitude: 84.46072574704885 },
//   ],
//   initialBatteryCharge: 9999,
// };

const payload = {
  waypoints: [
    { latitude: 25.5356, longitude: 84.8513 },
    { latitude: 25.889698, longitude: 81.370451 },
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

const numUsers = 1;
const startTimeConcurrent = Date.now();
const requests = [];

let totalLengthInKilometers = 0;
let totalTravelTimeInHours = 0;
let totalWaitingTimeInHours = 0;

for (let i = 0; i < numUsers; i++) {
  requests.push(
    axios
      .post("http://localhost:3000/api", payload)
      .then((response) => {
        response = response.data;
        totalLengthInKilometers +=
          Math.round((response.totalLengthInMeters / 1000) * 1000) / 1000;
        totalTravelTimeInHours +=
          Math.round((response.totalTravelTimeInSeconds / 3600) * 1000) / 1000;
        for (let time of response.time) {
          totalWaitingTimeInHours += time.endTime - time.startTime;
        }
      })
      .catch((error) => {
        console.error(`User ${i + 1}: Error -`, error);
      })
  );
}

Promise.all(requests)
  .then(() => {
    const endTimeConcurrent = Date.now();
    const timeTakenConcurrent = endTimeConcurrent - startTimeConcurrent;
    console.log(`Algorithm Used: Dijkstra`);
    console.log(
      `Single Request: Time Taken - ${timeTakenConcurrent} ms`
    );
    console.log(
      `Average Length In Kilometers - ${totalLengthInKilometers / numUsers} kms`
    );
    console.log(
      `Average Travel Time In Hours - ${totalTravelTimeInHours / numUsers} hrs`
    );
    // console.log(
    //   `Average Waiting Time In Hours - ${
    //     totalWaitingTimeInHours / numUsers
    //   } hrs`
    // );
  })
  .catch((error) => {
    console.error("Error:", error);
  });
