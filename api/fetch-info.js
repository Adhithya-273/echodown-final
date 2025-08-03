// File: /api/fetch-info.js (Using Official YouTube Data API)

// Helper function to manually parse a YouTube Video ID from a URL
const getVideoID = (url) => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        const videoId = urlObj.searchParams.get('v');
        if (!videoId) {
            throw new Error('Video ID not found in URL parameters.');
        }
        return videoId;
    } catch (e) {
        console.error("Failed to parse URL:", e.message);
        throw new Error('Invalid YouTube URL format.');
    }
};

// Helper function to parse YouTube's duration format (e.g., "PT1M35S") into seconds
const parseDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    match.shift(); // remove the full match
    const [hours, minutes, seconds] = match.map(part => parseInt(part?.slice(0, -1) || 0));
    return (hours * 3600) + (minutes * 60) + seconds;
};

// Helper function to format seconds into HH:MM:SS
const formatDuration = (seconds) => {
    if (isNaN(seconds) || seconds === null) return 'N/A';
    return new Date(seconds * 1000).toISOString().substr(11, 8);
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
    const API_KEY = process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
        console.error("FATAL: YOUTUBE_API_KEY environment variable not found.");
        return res.status(500).json({ success: false, error: 'Server configuration error: Missing API Key.' });
    }

    if (!url) {
        return res.status(400).json({ success: false, error: 'Missing YouTube URL.' });
    }

    try {
        const videoID = getVideoID(url);
        
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoID}&key=${API_KEY}&part=snippet,contentDetails`;
        
        const apiResponse = await fetch(apiUrl);
        const data = await apiResponse.json();

        if (!apiResponse.ok || data.error) {
            console.error("YouTube API Error Response:", data.error);
            throw new Error(data.error?.message || 'The YouTube API returned an error. The API key might be invalid or restricted.');
        }

        if (!data.items || data.items.length === 0) {
            throw new Error('Video not found with the provided ID. It may be private or deleted.');
        }

        const videoDetails = data.items[0];
        const snippet = videoDetails.snippet;
        const contentDetails = videoDetails.contentDetails;
        const durationInSeconds = parseDuration(contentDetails.duration);
        
        const responseData = {
            type: 'video',
            id: videoID,
            title: snippet.title,
            thumbnail: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
            duration: snippet.liveBroadcastContent === 'live' ? 'Live' : formatDuration(durationInSeconds),
        };
        
        return res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error('Full error in API handler:', error);
        return res.status(500).json({ 
            success: false, 
            error: `An unexpected error occurred: ${error.message}`
        });
    }
};