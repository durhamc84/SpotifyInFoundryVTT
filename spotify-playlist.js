// spotify-playlist.js

// Spotify API Authentication and Authorization
const CLIENT_ID = 'your-client-id';  // Replace with your Spotify App Client ID
const REDIRECT_URI = 'http://localhost:3000/callback';  // Redirect URI set in your Spotify App settings
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
let accessToken = null;

// Function to generate Spotify login URL
function getSpotifyLoginUrl() {
    const scope = 'user-read-private user-read-email playlist-read-private streaming';
    return `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${scope}`;
}

// Function to handle Spotify OAuth callback and extract access token
function handleSpotifyAuthCallback() {
    const hash = window.location.hash;
    if (hash) {
        const params = new URLSearchParams(hash.substr(1));
        accessToken = params.get('access_token');
        window.location.hash = '';  // Clear the hash so it doesn't re-trigger on refresh
    }
}

// Call the function to handle Spotify authentication when the module loads
handleSpotifyAuthCallback();

// Fetch Spotify Playlists using the API
async function getSpotifyPlaylists() {
    if (!accessToken) {
        console.error('No access token found! Please login.');
        return [];
    }

    const response = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    if (data.items) {
        return data.items;
    } else {
        console.error('Error fetching playlists:', data);
        return [];
    }
}

// Function to play a Spotify playlist using Spotify API
async function playSpotifyPlaylist(playlistId) {
    if (!accessToken) {
        console.error('No access token found! Please login.');
        return;
    }

    const response = await fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            context_uri: `spotify:playlist:${playlistId}`
        })
    });

    if (response.status === 204) {
        console.log('Playing playlist:', playlistId);
    } else {
        console.error('Error playing playlist:', response);
    }
}

// Spotify Playlist UI in Foundry VTT
class SpotifyPlaylistApp extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            title: 'Spotify Playlists',
            template: 'modules/spotify-playlist/templates/spotify-playlist.html',
            width: 400,
            height: 600,
            resizable: true
        });
    }

    async getData() {
        // Fetch Spotify Playlists and pass to the template
        const playlists = await getSpotifyPlaylists();
        return { playlists };
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Event listener for clicking on playlist items
        html.find('.playlist-item').click((event) => {
            const playlistId = event.currentTarget.dataset.id;
            playSpotifyPlaylist(playlistId);
        });
    }
}

// Initialize and render the Spotify Playlist App
Hooks.once('init', () => {
    game.spotifyPlaylistApp = new SpotifyPlaylistApp();
    game.spotifyPlaylistApp.render(true);
});

// Redirect users to Spotify login page
Hooks.once('ready', () => {
    if (!accessToken) {
        const loginUrl = getSpotifyLoginUrl();
        window.location = loginUrl;
    }
});
