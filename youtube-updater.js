"use strict";
const express = require('express');
const app = express();
const api = express();
const fs = require('fs');
const favicon = require('serve-favicon');

// external requests
const request = require('request-promise');
const url = require('url');

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/static'));
app.use(favicon(__dirname + '/static/global/favicon.ico'));
app.set('trust proxy', true);
app.use('/api', api);

app.listen(8082, function () {
    console.log('Example app listening on port 8082!');
});

// YOUTUBE API AUTH
let youtubeToken = "abc";
const youtubeRedirect = "http://localhost:8082/api/yt-auth";
const homepageUrl = '../../';
let uploadPlaylist = "123";
let youtubeUploads = [];

api.get('/yt-auth', (req, res) => {
    let urlParse = url.parse(req.url, true);
    let authCode = urlParse.query.code;
    const uri = (auth_uri, scope, access, youtubeRedirect, clientId) => {
        return `${auth_uri}?scope=${scope}&access_type=${access}&include_granted_scopes=true&state=` +
            `state_parameter_passthrough_value&redirect_uri=${youtubeRedirect}&response_type=code&client_id=${clientId}`;
    };
    let json = JSON.parse(fs.readFileSync("_config/client_secret.json"));

    if (typeof json === 'undefined' || !json) {
        return res.status(400).send("client_secret.json is invalid");
    }
    json = json.web;

    if (typeof authCode === 'undefined' || !authCode) {
        let scope = "https://www.googleapis.com/auth/youtubepartner";
        let access = "online";
        res.redirect(uri(json.auth_uri, scope, access, youtubeRedirect, json.client_id));
    }
    else {
        request.post({
            url: json.token_uri,
            form: {
                code: authCode,
                client_id: json.client_id,
                client_secret: json.client_secret,
                redirect_uri: youtubeRedirect,
                grant_type: 'authorization_code'
            }
        }, (err, httpResponse, body) => {
            if (err) {
                return res.status(400).send(`Authentication error: ${err}`);
            }
            youtubeToken = (JSON.parse(body)).access_token;
            res.redirect('../../app/');
        });
    }
});

api.get('/yt-desc/channel', (req, res) => {
    request({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/channels',
        qs: {
            access_token: youtubeToken,
            part: 'snippet,contentDetails,statistics',
            mine: true
        }
    }, (error, response, body) => {
        let apiErr = null;
        try {
            if (error) {
                return res.status(400).send(`Authentication error: ${error}`);
            }
            let json = JSON.parse(response.body);
            apiErr = json.error;
            uploadPlaylist = json.items[0].contentDetails.relatedPlaylists.uploads;
            res.status(200).send(response);
        } catch (err) {
            console.log(`There was an error: ${err} stay calm`);
            res.status(apiErr.code).send(youtubeRedirect);
        }
    });
});


api.get('/yt-desc/uploads/:range/:nextPageToken/:all', (req, res) => {
    let params = {
        access_token: youtubeToken,
        part: 'snippet,contentDetails,status',
        playlistId: uploadPlaylist,
        maxResults: req.params.range
    };

    if (req.params.nextPageToken === 'first') youtubeUploads = [];
    else params.pageToken = req.params.nextPageToken;

    request({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/playlistItems',
        qs: params
    }, function (error, response, body) {
        if (error) {
            return res.status(400).send("ERORRORR AUTH THE YOUTUBESS");
        }
        let json = JSON.parse(response.body);
        let range = parseInt(req.params.range);

        for (let i = 0; (i < range) && (youtubeUploads.length < req.params.all); i++) {
            let vid = json.items[i];
            if (typeof vid === 'undefined' || !vid) break;

            youtubeUploads.push(json.items[i]);
        }
        // console.log(json.items.length + " === " + range + "; " + ytUploads.length);

        if ((youtubeUploads.length === req.params.all) || typeof json.nextPageToken === 'undefined') {
            res.status(200).send(youtubeUploads);
        }
        else {
            res.redirect('/api/yt-desc/uploads/' + range + '/' + json.nextPageToken + '/' + req.params.all);
        }
    });
});

api.get('/yt-desc/uploadRange/:startId/:endId/:nextPageToken', (req, res) => {
    let params = {
        access_token: youtubeToken,
        part: 'snippet,contentDetails,status',
        playlistId: uploadPlaylist,
        maxResults: '50'
    };
    if (req.params.nextPageToken === 'first') youtubeUploads = [];

    else params.pageToken = req.params.nextPageToken;

    request({
        method: 'GET',
        url: 'https://www.googleapis.com/youtube/v3/playlistItems',
        qs: params
    }, (error, response, body) => {
        if (error) {
            return res.status(400).send("ERORRORR AUTH THE YOUTUBESS");
        }
        let json = JSON.parse(response.body);
        let startFlag = false;
        let endFlag = false;

        for (let i = 0; !endFlag; i++) {
            let vid = json.items[i];
            if (typeof vid === 'undefined') {
                break;
            }
            let id = vid.snippet.resourceId.videoId;
            if (!startFlag && (id === req.params.startId)) {
                startFlag = true;
            }
            if (id === req.params.endId) {
                endFlag = true;
            }
            if (startFlag) {
                youtubeUploads.push(json.items[i]);
            }
        }
        // console.log(json.items.length + " === " + range + "; " + ytUploads.length);

        if (endFlag || typeof json.nextPageToken === 'undefined') {
            if (!endFlag) {
                youtubeUploads = [];
            }
            res.status(200).send(youtubeUploads);
        }
        else res.redirect(`/api/yt-desc/uploadRange/${req.params.startId}/${req.params.endId}/${json.nextPageToken}`);

    });
});


api.get('/yt-logout', (req, res) => {

    if (youtubeToken == 'abc')res.redirect(homepageUrl);
    request({
        method: 'POST',
        url: `https://accounts.google.com/o/oauth2/revoke?token=${youtubeToken}`,
    }, (error, response, body) =>
    {
        res.redirect(homepageUrl);
    });
});

// Request that does not match api/ directory,
// Attempts to grab the html from views/pages/
app.get('*', (req, res) => {
    let purl = url.parse(req.url, true);
    let pathname = 'pages' + purl.pathname;

    if ((pathname)[pathname.length - 1] === '/') {
        pathname += 'index';
    }
    res.render(pathname, purl.query);
});