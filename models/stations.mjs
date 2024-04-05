import mongoose from "mongoose";

const stationsSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  reservedFrom: {
    type: Date,
    default: null,
  },
  reservedTill: {
    type: Date,
    default: null,
  },
});

stationsSchema.pre("save", function (next) {
  next();
});

const Stations = mongoose.model("Stations", stationsSchema);

export default Stations;

// const request = {
//   label: "IIT Patna Charging Station",
//   location: {
//     latitude: 1.2,
//     longitude: 1.2,
//   },
// };
