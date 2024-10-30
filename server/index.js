// server/index.js

const express = require('express');
const dotenv = require('dotenv');
const request = require('request');
const cors = require('cors');

dotenv.config();

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = "http://localhost:3000/auth/callback";  // Update this with your actual Foundry VTT redirect URI

const app = express();
app.use(cors());

// Login route to start the OAuth process
app.get('/auth/login', (req, res) => {
    const scope = "streaming user-read-email user-read-private";
    const state = generateRandomString(16);

    const auth_query_parameters = new URLSearchParams({
        response_type: "code",
        client_id: spotify_client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    });

    res.redirect('https://accounts.spotify.com/authorize?' + auth_query_parameters.toString());
});

// Callback route to exchange the code for access and refresh tokens
app.get('/auth/callback', (req, res) => {
    const code = req.query.code;

    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            const access_token = body.access_token;
            const refresh_token = body.refresh_token;
            res.json({
                access_token: access_token,
                refresh_token: refresh_token
            });
        } else {
            res.status(500).send('Failed to authenticate with Spotify.');
        }
    });
});

const generateRandomString = function (length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// Start the server
const port = 5000;
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
