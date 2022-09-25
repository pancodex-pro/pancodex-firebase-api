'use strict';

const functions = require('firebase-functions');
const jwt = require('jsonwebtoken');
const {cors} = require('./cors');
const {secret, projectId} = require('./secrets');
const admin = require("firebase-admin");

let app = null;
let firestore = null;

exports.updateDraft = functions.https.onRequest((req, res) => {
    if (!app) {
        app = admin.initializeApp();
        firestore = app.firestore();
    }
    return cors(req, res, async (e) => {
        if (req.method === 'POST') {
            const siteToken = req.query.sitetoken;
            if (!siteToken) {
                return res.status(401).send("Not authorized");
            }
            try {
                const decoded = jwt.verify(siteToken, secret);
                if (!decoded.projectId || decoded.projectId !== projectId) {
                    return res.status(401).send("Not authorized");
                }
                const dataModelDraft = req.body;
                console.log('[updateDraft] dataModelDraft: ', dataModelDraft);
                if (dataModelDraft) {
                    const {dataDocuments} = dataModelDraft;
                    console.log('[updateDraft] dataDocuments: ', dataDocuments);
                    if (dataDocuments) {
                        console.log('[updateDraft] dataDocuments.length: ', dataDocuments.length);
                        if (dataDocuments.length > 0) {
                            const tasks = [];
                            dataDocuments.forEach(dataDocumentItem => {
                                if (dataDocumentItem) {
                                    const {slug, locale, contentData} = dataDocumentItem;
                                    console.log('[updateDraft] dataDocumentItem: ', slug, locale);
                                    if (slug && locale && contentData) {
                                        tasks.push(
                                            firestore
                                                .collection('documentsDraft')
                                                .doc(`${slug}_${locale}`)
                                                .set(contentData)
                                        );
                                    }
                                }
                            });
                            try {
                                await Promise.all(tasks);
                            } catch (e) {
                                return res.status (200).json({
                                    status: 'error',
                                    error: e.message
                                });
                            }
                        }
                        return res.status (200).json({
                            status: 'success'
                        });
                    }
                }
                return res.status('500').send('Incorrect data model structure');
            } catch (err) {
                return res.status(500).send(err.message);
            }
        }
        return res.sendStatus(405); // Method Not Allowed
    });
});