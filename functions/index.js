'use strict';

const helloWorld = require('./helloWorld');
const authenticate = require('./authenticate');
const updateDraft = require('./updateDraft');

exports.helloWorld = helloWorld.helloWorld;
exports.authenticate = authenticate.authenticate;
exports.updateDraft = updateDraft.updateDraft;
