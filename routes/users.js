var express = require("express");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const randomString = require("randomstring");

const helpers = require("../helpers");
const config = require("../config");

const Users = require("../models/Users");

/**
 * @desc Fetch user from the Database for a given Email ID
 * @param email
 */
router.get("/:email", async (req, res, next) => {
  try {
    const email = req.params.email;

    //Check if user exists in DB
    const userData = await Users.findOne({ email: email }, "-_id -password");
    if (!userData) {
      res.status(403).json({ Error: "User Does not Exists" });
    }
    res.status(200).json(userData);
  } catch (err) {
    next(err);
  }
});

/**
 * @desc Validate User Details and Register into the Database
 *
 * @param firstName
 * @param lastName
 * @param email
 * @param password
 * @param confirmPasswod
 */

router.post(
  "/",
  [
    body("firstName", "First Name is Required")
      .notEmpty()
      .isString(),
    body("lastName", "Last Name should be a String").isString(),
    body("email", "Enter a valid Email")
      .notEmpty()
      .isString(),
    body("password", "Password is required and should be min 6 characters")
      .isString()
      .isLength({ min: 6 }),
    body("confirmPassword", "Password does not match").custom(
      (value, { req }) => {
        if (value === req.body.password) return true;
        else false;
      }
    )
  ],
  async (req, res, next) => {
    try {
      // Throw back to user if there are validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(500).json({ Error: errors.array() });
      }
      // Validate if user already exists
      let userData = await Users.findOne({ email: req.body.email });
      if (userData) {
        return res
          .status(403)
          .json({ Error: "User with that email already exists" });
      }

      // Generate a token
      let token = randomString.generate();

      // Prepare user object and save
      userData = req.body;
      const salt = await bcrypt.genSalt(config.saltRounds);
      userData.password = await bcrypt.hash(userData.password, salt);
      userData.token = token;
      await Users.create(userData);

      // Verify Email Address
      helpers.verifyEmail(userData.email, token);

      // Return back Success back
      res.status(200).json({ Success: "User Created Successfully" });
    } catch (err) {
      console.error(err);
      res.status = 500;
      res.message = "Unable to Create a User";
      next(err);
    }
  }
);

/**
 * @desc Verify if the User Token is valid and mark the User as Verified
 * @param token
 */

router.all("/verify/:token", async (req, res) => {
  try {
    const userData = await Users.findOne(
      { token: req.params.token },
      "-password"
    );

    if (!userData) {
      res.send("<h3>The Verification Link is Invalid</h3>");
    }

    const createDate = userData._id.getTimestamp();
    const currentDate = new Date(Date.now());

    const minutesElapsed = Math.floor((currentDate - createDate) / 1000 / 60);

    if (minutesElapsed > config.verifyTimeOut) {
      res.send("<h3>The Verification Link is Invalid</h3>");
    } else {
      await Users.updateOne(
        { email: userData.email },
        { $set: { verified: true } }
      );
      res.send("<h3>User Verified Successfully</h3>");
    }
  } catch (err) {
    console.error(err);
    res.status = 500;
    res.message = "Unable to Verify User";
    next(err);
  }
});

/**
 * @desc If the user is not already verified verify the user
 * @param email
 */

router.all("/reverify/:email", async (req, res) => {
  try {
    const userData = await Users.findOne(
      { email: req.params.email },
      "-password"
    );

    // If the user does not exists
    if (!userData) {
      res.send("<h1>User does not Exist. Please register.</h1>");
      return;
    }

    // If User is already Verified Ignore
    if (userData.verified) {
      res.send("<h1>User is already Verified. Please login.</h1>");
      return;
    }

    // Generate and update the Token
    const token = randomString.generate();
    await Users.updateOne(
      { email: userData.email },
      { $set: { token: token } }
    );

    // Verify Email Address
    helpers.verifyEmail(userData.email, token);

    res.send("<h1>Email Has been sent. Please check your inbox</h1>");
  } catch (err) {
    console.error(err);
    res.status = 500;
    res.message = "Unable to Verify User";
    next(err);
  }
});

/**
 * @desc Error Handling for the user route
 * @param error
 * @param message
 */
router.use("/", (err, req, res, next) => {
  console.error(err.stack);
  res.status(res.status).json({ Error: res.message });
});

module.exports = router;
