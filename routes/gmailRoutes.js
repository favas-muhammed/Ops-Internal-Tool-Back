const express = require("express");
const router = express.Router();
const gmailService = require("../services/gmailService");

router.get("/emails", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const emails = await gmailService.getEmails(token);
    res.json(emails);
  } catch (error) {
    console.error("Error in /emails route:", error);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

module.exports = router;
