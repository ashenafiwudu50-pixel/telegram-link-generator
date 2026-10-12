
const express = require('express');
const { Telegraf } = require('telegraf');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const app = express();
app.use(express.json({ limit: '1mb' }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const VERCEL_URL = 'https://telegram-link-generator-gules.vercel.app';

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN environment variable is missing');
}

const bot = new Telegraf(BOT_TOKEN);

// Download or stream a Telegram file by file_id.
async function serveFile(req, res) {
  try {
    const fileId = req.query.fileId;

    if (typeof fileId !== 'string' || !fileId) {
      return res.status(400).send('Missing fileId');
    }

    const fileUrl = await bot.telegram.getFileLink(fileId);
    const upstream = await fetch(fileUrl.href);

    if (!upstream.ok || !upstream.body) {
      console.error('Telegram download status:', upstream.status);
      return res.status(502).send(
        `Telegram download failed: ${upstream.status}`
      );
    }

    res.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') ||
        'application/octet-stream'
    );

    const length = upstream.headers.get('content-length');
    if (length) {
      res.setHeader('Content-Length', length);
    }

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="telegram-download"'
    );

    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (err) {
    console.error('File handler error:', err.message);

    if (!res.headersSent) {
      res.status(502).send('Unable to retrieve Telegram file');
    } else {
      res.destroy(err);
    }
  }
}

app.get('/dl', serveFile);
app.get('/stream', serveFile);

// Handle files sent to the bot.
bot.on(['video', 'document', 'audio', 'photo'], async (ctx) => {
  try {
    const message = ctx.message;
    let fileId;

    if (message.video) {
      fileId = message.video.file_id;
    } else if (message.document) {
      fileId = message.document.file_id;
    } else if (message.audio) {
      fileId = message.audio.file_id;
    } else if (message.photo) {
      fileId = message.photo[message.photo.length - 1].file_id;
    }

    if (!fileId) return;

    const encodedId = encodeURIComponent(fileId);
    const downloadLink =
      `${VERCEL_URL}/dl?fileId=${encodedId}`;
    const streamLink =
      `${VERCEL_URL}/stream?fileId=${encodedId}`;

    await ctx.reply(
      `Download Link:\n${downloadLink}\n\n` +
      `Stream Link:\n${streamLink}\n\n` +
      'Note: Telegram Bot API download limits apply.'
    );
  } catch (err) {
    console.error('Bot handler error:', err.message);
    await ctx.reply('Sorry, I could not generate your file link.');
  }
});

// Telegram webhook endpoint.
app.post('/api/telegram', async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.sendStatus(500);
  }
});

// Health check.
app.get('/', (req, res) => {
  res.send('Telegram File Link Generator is running!');
});

module.exports = app;
