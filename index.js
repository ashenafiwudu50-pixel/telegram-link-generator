
app.get(['/dl/:fileId', '/stream/:fileId'], async (req, res) => {
  try {
    const fileId = req.params.fileId;

    if (!fileId) {
      return res.status(400).send('Missing file ID');
    }

    const fileUrl = await bot.telegram.getFileLink(fileId);

    const upstream = await fetch(fileUrl.href);

    if (!upstream.ok || !upstream.body) {
      console.error('Telegram download status:', upstream.status);

      return res.status(502).json({
        error: 'Telegram download failed',
        upstreamStatus: upstream.status
      });
    }

    res.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') ||
        'application/octet-stream'
    );

    const filename = 'telegram-download';
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    const { Readable } = require('node:stream');
    const { pipeline } = require('node:stream/promises');

    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (err) {
    console.error('Download handler error:', err.message);

    if (!res.headersSent) {
      res.status(502).json({
        error: 'Unable to retrieve Telegram file'
      });
    } else {
      res.destroy(err);
    }
  }
});
