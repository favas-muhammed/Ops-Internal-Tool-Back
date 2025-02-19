const express = require("express");
const { google } = require("googleapis");
const dotenv = require("dotenv");
const User = require("../models/User.js");

dotenv.config();

const router = express.Router();

router.get("/emails", async (req, res) => {
  const { userEmail } = req.query;
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const refreshToken = user.googleRefreshToken;
    if (!refreshToken) {
      return res.status(400).send("Refresh token not found");
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    async function refreshAccessToken() {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        return credentials.access_token;
      } catch (error) {
        console.error("Failed to refresh access token:", error);
        throw error;
      }
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    async function fetchEmails() {
      try {
        const accessToken = await refreshAccessToken();
        oauth2Client.setCredentials({ access_token: accessToken });

        const response = await gmail.users.messages.list({
          userId: "me",
          maxResults: 10,
        });

        const messages = response.data.messages;
        if (!messages || messages.length === 0) {
          return [];
        }

        const emailDetails = await Promise.all(
          messages.map(async (message) => {
            const messageData = await gmail.users.messages.get({
              userId: "me",
              id: message.id,
              format: "full",
            });
            return messageData.data;
          })
        );

        return emailDetails;
      } catch (error) {
        console.error("Error fetching emails:", error);
        throw error;
      }
    }

    const emails = await fetchEmails();
    res.json(emails);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Failed to fetch emails");
  }
});

module.exports = router;
