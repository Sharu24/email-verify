const mongoose = require("mongoose");

// Define Schema for User Route
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  token: {
    type: String
  }
});

// Export the User Schema
module.exports = mongoose.model("Users", userSchema, "population");
