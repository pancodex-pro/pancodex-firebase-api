'use strict';

const functions = require('firebase-functions');
const {cors} = require('./cors');

exports.updateDraft = functions.https.onRequest((req, res) => {
    return cors(req, res, async (e) => {
        const siteToken = req.query.sitetoken;
        if (!siteToken) {
            return res.status(500).send("Missing site token in the request");
        }
        return res.status(200).json({
            status: siteToken
        });
    });
});