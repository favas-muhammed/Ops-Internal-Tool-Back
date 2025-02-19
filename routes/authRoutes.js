const express = require("express");
const { google } = require("googleapis");
const dotenv = require("dotenv");
const User = require("../models/User.js");

dotenv.config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate the URL for Google's OAuth 2.0 consent page.
router.get("/google", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save the refresh_token securely
    const { refresh_token, access_token, expiry_date } = tokens;
    console.log("Refresh Token:", refresh_token);

    // Fetch user profile information
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();
    const email = data.email;
    const name = data.name;

    // Check if user exists, if not create new user in DB
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        name,
        googleRefreshToken: refresh_token,
      });
      await user.save();
    } else {
      user.googleRefreshToken = refresh_token;
      await user.save();
    }

    // Redirect back to the frontend with the tokens and user info
    res.redirect(
      `http://localhost:5173/auth/success?access_token=${access_token}&refresh_token=${refresh_token}&expiry_date=${expiry_date}&email=${email}&name=${name}`
    );
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed");
  }
});

module.exports = router;
