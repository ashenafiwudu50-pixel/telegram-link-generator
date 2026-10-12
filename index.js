const express = require('express');
const app = express();

const BOT_TOKEN = process.env.BOT_TOKEN;

app.get('/dl/:fileId', (req, res) => {
  const encryptedData = req.params.fileId;

  if (!encryptedData) {
    return res.status(400).send("Error: Invalid Link");
  }

  if (!BOT_TOKEN) {
    return res.status(500).send("Error: BOT_TOKEN is not configured");
  }

  const tgFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${encryptedData}`;
  return res.redirect(302, tgFileUrl);
});

app.get('/', (req, res) => {
  res.send("Telegram Public Link Generator Web Server is Running!");
});

module.exports = app;
