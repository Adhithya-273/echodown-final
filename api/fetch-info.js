// File: /api/fetch-info.js (Using @distube/ytdl-core)
const ytdl = require('@distube/ytdl-core');

// Helper function to format duration from seconds to HH:MM:SS
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null) return 'N/A';
    return new Date(parseInt(seconds) * 1000).toISOString().substr(11, 8);
};

module.exports = async (req, res) => {
    // Standard CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ success: false, error: 'Missing YouTube URL.' });
    }

    try {
        const info = await ytdl.getInfo(url);
        const details = info.videoDetails;

        const responseData = {
            type: 'video',
            id: details.videoId,
            title: details.title,
            thumbnail: details.thumbnails[details.thumbnails.length - 1].url,
            duration: details.isLive ? 'Live' : formatDuration(details.lengthSeconds),
        };
        
        return res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error('--- DETAILED FETCH ERROR ---');
        console.error(error);
        console.error('--- END DETAILED ERROR ---');
        
        res.status(500).json({ 
            success: false, 
            error: `Failed to get video info: ${error.message}` 
        });
    }
};