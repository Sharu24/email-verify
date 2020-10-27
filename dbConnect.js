const mongoose = require("mongoose");
const config = require("./config");

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri, config.dbOptions);
    console.log("Connected to Mongo DB Successfully");
  } catch (err) {
    console.error("Unable to connect to Mongo DB");
  }
};

connectDB();
