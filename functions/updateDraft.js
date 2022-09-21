'use strict';

const functions = require('firebase-functions');
const jwt = require('jsonwebtoken');
const {cors} = require('./cors');
const {secret, projectId} = require('./secrets');

exports.updateDraft = functions.https.onRequest((req, res) => {
    return cors(req, res, async (e) => {
        const siteToken = req.query.sitetoken;
        if (!siteToken) {
            return res.status(401).send("Not authorized");
        }
        try {
            const decoded = jwt.verify(siteToken, secret);
            if (!decoded.projectId || decoded.projectId !== projectId) {
                return res.status(401).send("Not authorized");
            }
            return res.status(200).json({
                status: decoded.projectId
            });
        } catch(err) {
            return res.status(500).send(err.message);
        }
    });
});