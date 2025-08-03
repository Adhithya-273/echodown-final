// File: /api/download-mp3.js
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Point fluent-ffmpeg to the bundled binary, making it more reliable
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// This is the Vercel Serverless Function
module.exports = async (req, res) => {
    // Allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { videoId, title } = req.query;

        if (!videoId) {
            return res.status(400).json({ success: false, error: 'Missing video ID.' });
        }

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const cleanTitle = (title || 'audio').replace(/[<>:"/\\|?*]+/g, '_');

        // Set response headers to trigger a download in the browser
        res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        // Get the audio-only stream from ytdl
        const audioStream = ytdl(videoUrl, {
            quality: 'highestaudio',
            filter: 'audioonly',
        });
        
        // IMPORTANT: Vercel has a timeout. If ffmpeg takes too long, this will fail.
        // This is best for short videos.
        ffmpeg(audioStream)
            .audioBitrate(128)
            .toFormat('mp3')
            .on('error', (err) => {
                console.error('FFmpeg error:', err.message);
                // We can't send a JSON error if headers are already sent, so just end the stream.
                if (!res.headersSent) {
                    res.status(500).send(`FFmpeg error: ${err.message}`);
                }
            })
            .pipe(res, { end: true });

    } catch (error) {
        console.error('Download process error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: 'Failed to start download process.' });
        }
    }
};
