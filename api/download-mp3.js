// File: /api/download-mp3.js (Final Corrected Version)
const play = require('play-dl');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Point fluent-ffmpeg to the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Function to apply user cookies to play-dl
const setAuth = async () => {
    const cookie = process.env.YOUTUBE_COOKIES;
    if (cookie && typeof cookie === 'string') {
        try {
            const sanitizedCookie = cookie.replace(/[^\x20-\x7E]/g, '');
            await play.setToken({
                youtube: {
                    cookie: sanitizedCookie,
                },
            });
            console.log('Successfully attempted to set YouTube authentication token.');
        } catch (e) {
            console.error('Error setting YouTube token:', e.message);
        }
    } else {
        console.warn('Warning: YOUTUBE_COOKIES environment variable not found or is not a string.');
    }
};

module.exports = async (req, res) => {
    // Standard CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await setAuth();

        const { videoId, title } = req.query;

        // Rigorous check for videoId
        if (!videoId || typeof videoId !== 'string' || videoId === 'undefined') {
            console.error(`Invalid videoId received: ${videoId}`);
            return res.status(400).json({ success: false, error: 'Invalid or missing video ID.' });
        }

        const cleanTitle = (title || 'audio').replace(/[<>:"/\\|?*]+/g, '_');
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        console.log(`Attempting to stream directly from URL: ${videoUrl}`);
        
        // Reverting to the more direct stream method.
        const stream = await play.stream(videoUrl, {
            discordPlayerCompatibility: true
        });

        res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        ffmpeg(stream.stream)
            .audioBitrate(128)
            .toFormat('mp3')
            .on('error', (err) => {
                console.error('FFmpeg error:', err.message);
                if (!res.headersSent) {
                    res.status(500).send(`FFmpeg error: ${err.message}`);
                }
            })
            .pipe(res, { end: true });

    } catch (error) {
        console.error('--- DETAILED DOWNLOAD ERROR ---');
        console.error(error);
        console.error('--- END DETAILED ERROR ---');
        
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                error: `Failed to process download. The video may be unavailable or blocked. Please check the server logs for details.` 
            });
        }
    }
};