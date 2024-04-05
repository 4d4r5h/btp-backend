import express from "express";
import mongoose from "mongoose";
import apiRoute from "./routes/api.mjs";
import stationsRoute from "./routes/stations.mjs";
import usersRoute from "./routes/users.mjs";
import tripsRoute from "./routes/trips.mjs";

const app = express();
const port = process.env.PORT || 3000;
const uri =
  "mongodb+srv://admin:4Jyf6qu4K50GvhvM@maincluster.2yx7xvt.mongodb.net/BTP?retryWrites=true&w=majority&appName=MainCluster";

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.static("public"));

app.use("/", apiRoute);
app.use("/", usersRoute);
app.use("/", stationsRoute);
app.use("/", tripsRoute);

mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected to MongoDB.");
  })
  .catch((error) => {
    console.log(`${error}`);
  });

app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});

// import express from "express";
// import mongoose from "mongoose";
// import cluster from "cluster";
// import os from "os";
// import process from "node:process";
// import apiRoute from "./routes/api.mjs";
// import stationsRoute from "./routes/stations.mjs";
// import usersRoute from "./routes/users.mjs";
// import tripsRoute from "./routes/trips.mjs";

// const numCPUs = 4;

// if (cluster.isPrimary) {
//   console.log(`Primary ${process.pid} is running.`);

//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died.`);
//   });
// } else {
//   const app = express();
//   const port = process.env.PORT || 3000;
//   const uri =
//     "mongodb+srv://admin:4Jyf6qu4K50GvhvM@maincluster.2yx7xvt.mongodb.net/BTP?retryWrites=true&w=majority&appName=MainCluster";

//   app.set("view engine", "ejs");

//   app.use(express.json());
//   app.use(express.static("public"));

//   app.use("/", apiRoute);
//   app.use("/", usersRoute);
//   app.use("/", stationsRoute);
//   app.use("/", tripsRoute);

//   mongoose
//     .connect(uri)
//     .then(() => {
//       console.log("Connected to MongoDB.");
//     })
//     .catch((error) => {
//       console.log(`${error}`);
//     });

//   app.listen(port, () => {
//     console.log(`Worker ${process.pid} listening on port ${port}.`);
//   });
// }
