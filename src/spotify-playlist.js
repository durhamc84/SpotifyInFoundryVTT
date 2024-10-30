// src/spotify-playlist.js

// Register settings when the module is initialized
Hooks.once('init', () => {
    // Register the Spotify Access Token setting
    game.settings.register("spotify-vtt-module", "spotifyAccessToken", {
        name: "Spotify Access Token",
        hint: "Paste your Spotify Access Token here after authenticating via the OAuth flow.",
        scope: "client",
        config: true,
        type: String,
        default: ""
    });

    // Register the Spotify Playlist URL setting
    game.settings.register("spotify-vtt-module", "playlistURL", {
        name: "Spotify Playlist URL",
        hint: "Enter the Spotify Playlist URL you want to play.",
        scope: "client",
        config: true,
        type: String,
        default: ""
    });
});

// When Foundry is ready, retrieve the settings and initialize playback
Hooks.once('ready', () => {
    const accessToken = game.settings.get('spotify-vtt-module', 'spotifyAccessToken');
    const playlistURL = game.settings.get('spotify-vtt-module', 'playlistURL');

    // Check if both access token and playlist URL are available
    if (!accessToken || !playlistURL) {
        ui.notifications.error('Please provide both a Spotify access token and playlist URL in the settings.');
        return;
    }

    // Initialize the Web Playback SDK
    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
            name: 'Foundry VTT Spotify Player',
            getOAuthToken: cb => { cb(accessToken); },  // Provide the access token
            volume: 0.5
        });

        // Connect the player
        player.connect();

        // Listen for player readiness and start playback when ready
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            playSpotifyPlaylist(accessToken, playlistURL, device_id);  // Start playback
        });

        player.addListener('player_state_changed', state => {
            if (!state) return;
            console.log('Player state changed:', state);
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
        });
    };

    // Fetch and display user profile after the module is loaded
    getUserProfile(accessToken);
});

// Function to play Spotify Playlist using the Web Playback SDK
function playSpotifyPlaylist(accessToken, playlistURL, deviceId) {
    const playlistId = extractPlaylistId(playlistURL);

    if (!playlistId) {
        ui.notifications.error('Invalid Spotify playlist URL.');
        return;
    }

    fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            context_uri: `spotify:playlist:${playlistId}`,
            device_ids: [deviceId]
        })
    }).then(response => {
        if (response.status === 204) {
            console.log('Playback started');
        } else {
            console.error('Playback error:', response);
        }
    });
}

// Function to fetch the current user's Spotify profile
async function getUserProfile(accessToken) {
    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            Authorization: 'Bearer ' + accessToken
        }
    });

    if (!response.ok) {
        console.error('Failed to fetch user profile:', response.statusText);
        return null;
    }

    const profileData = await response.json();
    console.log('User Profile:', profileData);
    return profileData;
}

// Helper function to extract the playlist ID from the Spotify URL
function extractPlaylistId(playlistURL) {
    const match = playlistURL.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}
