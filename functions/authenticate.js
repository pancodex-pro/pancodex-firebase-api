'use strict';

const functions = require('firebase-functions');
const jwt = require('jsonwebtoken');
const {cors} = require('./cors');
const {validPassId, appId, secret} = require('./secrets');

exports.authenticate = functions.https.onRequest((req, res) => {
    return cors(req, res, async (e) => {
        if (req.method === 'GET') {
            const passId = req.query.passId;
            if (!passId) {
                return res.status(500).send("Missing passId in the request");
            }
            if (passId === validPassId) {
                try {
                    const token = jwt.sign({appId}, secret, {algorithm: 'HS256'});
                    return res.status(200).json({
                        token
                    });
                } catch (e) {
                    return res.status(500).send(e.message);
                }
            }
            return res.status(401).send("Not authenticated");
        }
        return res.sendStatus(405);
    });
});
