// File: /api/download-mp3.js (Using play-dl for reliability)
const play = require('play-dl');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

// Point fluent-ffmpeg to the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Function to apply user cookies to play-dl
const setAuth = async () => {
    const cookie = process.env.YOUTUBE_COOKIES;
    if (cookie) {
        try {
            // Sanitize the cookie string to remove invalid characters
            const sanitizedCookie = cookie.replace(/[^\x20-\x7E]/g, '');
            await play.setToken({
                youtube: {
                    cookie: sanitizedCookie,
                },
            });
            console.log('Successfully attempted to set YouTube authentication token.');
            
            // Let's check if the token is considered valid by the library
            const validation = await play.is_token_valid();
            console.log(`play-dl token validation result: ${JSON.stringify(validation)}`);
            if (!validation.youtube) {
                 console.warn("Warning: play-dl reports the provided YouTube cookie is not valid. Please provide a fresh one.");
            }
        } catch (e) {
            console.error('Error setting YouTube token:', e.message);
        }
    } else {
        console.warn('Warning: YOUTUBE_COOKIES environment variable not found. Downloads may fail.');
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
        // Set authentication cookies before processing the request
        await setAuth();

        const { videoId, title } = req.query;

        if (!videoId) {
            return res.status(400).json({ success: false, error: 'Missing video ID.' });
        }

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const cleanTitle = (title || 'audio').replace(/[<>:"/\\|?*]+/g, '_');

        // Use play-dl to get the audio stream
        const stream = await play.stream(videoUrl, {
            discordPlayerCompatibility: true // A setting for better compatibility
        });

        // Set response headers to trigger a download in the browser
        res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');

        // Use ffmpeg to convert the stream to MP3 and pipe it to the response
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
        console.error('Download process error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: `Failed to start download: ${error.message}` });
        }
    }
};
