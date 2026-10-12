const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN || "8622375669:AAFmp4Slr88sfZz7HRx8ttYBMf3x_f0V8WA";
const VERCEL_URL = "https://telegram-link-generator-gules.vercel.app";

const bot = new Telegraf(BOT_TOKEN);

// በቀጥታ ወደ ቴሌግራም ፋይል አድራሻ ማዞሪያ (Direct Redirect)
app.get('/dl/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    if (!fileId) return res.status(400).send("Error: Invalid Link");

    // በቴሌግራም API በቀጥታ ፋይሉን ማውረድ የሚቻልበት ሊንክ
    const tgFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileId}`;
    return res.redirect(302, tgFileUrl);
});

app.get('/stream/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    if (!fileId) return res.status(400).send("Error: Invalid Link");

    const tgFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileId}`;
    return res.redirect(302, tgFileUrl);
});

// የቴሌግራም ቦት መልዕክት ተቀባይ (Bot Handler)
bot.on(['video', 'document', 'audio', 'photo'], async (ctx) => {
    try {
        let fileId = null;
        
        if (ctx.message.video) {
            fileId = ctx.message.video.file_id;
        } else if (ctx.message.document) {
            fileId = ctx.message.document.file_id;
        } else if (ctx.message.audio) {
            fileId = ctx.message.audio.file_id;
        } else if (ctx.message.photo) {
            fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        }

        if (fileId) {
            const downloadLink = `${VERCEL_URL}/dl/${fileId}`;
            const streamLink = `${VERCEL_URL}/stream/${fileId}`;

            const replyText = 
                `⚡ **Download Link:**\n${downloadLink}\n\n` +
                `🍿 **Stream Link:**\n${streamLink}\n\n` +
                `⚠️ **Note:** Optimized for 1DM App (Supports Resume).`;

            await ctx.reply(replyText, { parse_mode: 'Markdown' });
        }
    } catch (error) {
        console.error("Error processing file:", error);
    }
});

app.post(`/api/telegram`, (req, res) => {
    bot.handleUpdate(req.body, res);
});

app.get('/', (req, res) => {
    res.send("Telegram Public Link Generator & Bot Server is Running!");
});

module.exports = app;
