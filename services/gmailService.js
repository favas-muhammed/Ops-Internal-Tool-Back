const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

class GmailService {
  constructor() {
    this.oauth2Client = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async getEmails(token) {
    try {
      this.oauth2Client.setCredentials({ access_token: token });
      const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

      const res = await gmail.users.messages.list({
        userId: "me",
        maxResults: 10,
        q: "in:inbox",
      });

      return res.data.messages || [];
    } catch (error) {
      console.error("Error fetching emails:", error);
      throw error;
    }
  }
}

module.exports = new GmailService();
