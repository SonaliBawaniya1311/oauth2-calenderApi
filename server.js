import express from 'express';
import dotenv from 'dotenv';
import { google } from 'googleapis';

const app = express();
dotenv.config();

const port = process.env.PORT || 8000;

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

const scopes = ['https://www.googleapis.com/auth/calendar.events'];

app.get('/rest/v1/calendar/init/', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  res.redirect(url);
});

app.get('/rest/v1/calendar/redirect/', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log(tokens);
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.json({ events: events.data.items });
  } catch (err) {
    console.error(" error in redirect "+err);
    res.status(500).send('Error fetching events');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
