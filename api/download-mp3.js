// File: /api/download-mp3.js (Proxy Method)
const play = require('play-dl');

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

        const { videoId } = req.query;

        if (!videoId || typeof videoId !== 'string' || videoId === 'undefined') {
            return res.status(400).json({ success: false, error: 'Invalid or missing video ID.' });
        }

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Fetch all video info
        const videoInfo = await play.video_info(videoUrl);

        // Find the best audio-only format (m4a is common and high quality)
        const bestAudio = videoInfo.format.find(f => f.mime_type.startsWith('audio/mp4'));

        if (!bestAudio) {
            throw new Error('No suitable audio-only format found for this video.');
        }

        // The job of this function is now to simply return the direct download URL
        return res.status(200).json({
            success: true,
            downloadUrl: bestAudio.url
        });

    } catch (error) {
        console.error('--- DETAILED LINK FINDER ERROR ---');
        console.error(error);
        console.error('--- END DETAILED ERROR ---');
        
        res.status(500).json({ 
            success: false, 
            error: `Failed to get download link: ${error.message}` 
        });
    }
};
