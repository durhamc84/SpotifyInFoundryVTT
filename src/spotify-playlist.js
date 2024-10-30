// src/spotify-playlist.js

const CLIENT_ID = 'your-spotify-client-id';  // Your registered Spotify Client ID
const REDIRECT_URI = 'http://localhost:3000/auth/callback';  // Must match with the backend redirect URI

// Initialize the Web Playback SDK and authenticate Spotify users
window.onSpotifyWebPlaybackSDKReady = () => {
    const token = localStorage.getItem('spotifyAccessToken');
    if (!token) {
        authenticateSpotify();
        return;
    }

    const player = new Spotify.Player({
        name: 'Foundry VTT Spotify Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    player.connect();

    player.addListener('player_state_changed', state => {
        if (state) {
            const currentTrack = state.track_window.current_track;
            console.log('Currently Playing:', currentTrack);
        }
    });

    player.addListener('ready', ({ device_id }) => {
        console.log('Device ID registered:', device_id);
    });

    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline:', device_id);
    });
};

// Spotify authentication flow
function authenticateSpotify() {
    const authUrl = `http://localhost:5000/auth/login`;  // Redirects to the backend login
    window.location.href = authUrl;
}

// Handle authentication callback
function handleSpotifyAuthCallback() {
    const hash = window.location.hash;
    if (hash) {
        const params = new URLSearchParams(hash.substr(1));
        const accessToken = params.get('access_token');
        if (accessToken) {
            localStorage.setItem('spotifyAccessToken', accessToken);
            window.location.hash = '';
        }
    }
}

handleSpotifyAuthCallback();
