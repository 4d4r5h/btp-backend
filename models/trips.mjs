import mongoose from "mongoose";

const tripsSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  startLocation: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  endLocation: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  chargingStations: [
    {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },
  ],
  startTime: {
    type: Date,
    required: true,
    default: null,
  },
  endTime: {
    type: Date,
    default: null,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

tripsSchema.pre("save", function (next) {
  next();
});

const Trips = mongoose.model("Trips", tripsSchema);

export default Trips;

// const request = {
//   username: "adarsh",
//   startLocation: {
//     latitude: 1.2,
//     longitude: 1.2,
//   },
//   endLocation: {
//     latitude: 12.2,
//     longitude: 12.2,
//   },
//   chargingStations: [
//     {
//       latitude: 4.2,
//       longitude: 4.2,
//     },
//     {
//       latitude: 9.2,
//       longitude: 9.2,
//     },
//   ],
// };

// const request = {
//     id: ID
// };
