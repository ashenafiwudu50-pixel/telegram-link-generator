const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN || "8622375669:AAFmp4Slr88sfZz7HRx8ttYBMf3x_f0V8WA";
const VERCEL_URL = "https://telegram-link-generator-gules.vercel.app";

const bot = new Telegraf(BOT_TOKEN);

// 1. ፋይሉን ከቴሌግራም አግኝቶ በቀጥታ ማዞሪያ (Redirector)
app.get('/dl/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        if (!fileId) return res.status(400).send("Error: Invalid Link");

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
        const data = await response.json();

        if (!data.ok) {
            return res.status(404).send("Error: File not found on Telegram");
        }

        const filePath = data.result.file_path;
        const tgFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        
        return res.redirect(302, tgFileUrl);
    } catch (error) {
        return res.status(500).send("Internal Server Error");
    }
});

app.get('/stream/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        if (!fileId) return res.status(400).send("Error: Invalid Link");

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
        const data = await response.json();

        if (!data.ok) {
            return res.status(404).send("Error: File not found on Telegram");
        }

        const filePath = data.result.file_path;
        const tgFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        
        return res.redirect(302, tgFileUrl);
    } catch (error) {
        return res.status(500).send("Internal Server Error");
    }
});

// 2. የቴሌግራም ቦት መልዕክት ተቀባይ (Bot Handler)
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
