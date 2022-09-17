'use strict';

// [START all]
// [START import]
// The Cloud Functions for Firebase SDK to create Cloud Functions and set up triggers.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { cors } = require('./cors');
const functions = require('firebase-functions');

// The Firebase Admin SDK to access Firestore.
const admin = require('firebase-admin');

// Import Node.js stream
// const stream = require('stream');

const BusBoy = require('busboy');

admin.initializeApp();

exports.helloWorld = functions.https.onRequest((req, res) => {
    return cors(req, res, async (e) => {
        if (e) {
            return res.status(500).send(e.message);
        } else {
            if (req.method === 'POST') {
                functions.logger.info("Hello logs!", {structuredData: true});
                console.log('POST request: ', req.headers);
                const busboy = BusBoy({headers: req.headers});
                const tmpdir = os.tmpdir();

                // This object will accumulate all the fields, keyed by their name
                const fields = {};

                // This object will accumulate all the uploaded files, keyed by their name.
                const uploads = {};

                // This code will process each non-file field in the form.
                busboy.on('field', (fieldname, val) => {
                    /**
                     *  TODO(developer): Process submitted field values here
                     */
                    console.log(`Processed field ${fieldname}: ${val}.`);
                    fields[fieldname] = val;
                });

                const fileWrites = [];
                const bucketUploads = [];

                // This code will process each file uploaded.
                busboy.on('file', (fieldname, file, {filename, encoding, mimeType}) => {
                    // Note: os.tmpdir() points to an in-memory file system on GCF
                    // Thus, any files in it must fit in the instance's memory.
                    console.log(`Processed file ${filename}`);
                    const filepath = path.join(tmpdir, filename);
                    uploads[fieldname] = {
                        filepath,
                        destFilePath: `${filename}`,
                        mimeType
                    };

                    const writeStream = fs.createWriteStream(filepath);
                    file.pipe(writeStream);

                    // File was processed by Busboy; wait for it to be written.
                    // Note: GCF may not persist saved files across invocations.
                    // Persistent files must be kept in other locations
                    // (such as Cloud Storage buckets).
                    const promise = new Promise((resolve, reject) => {
                        file.on('end', () => {
                            writeStream.end();
                        });
                        writeStream.on('finish', resolve);
                        writeStream.on('error', reject);
                    });
                    fileWrites.push(promise);
                });

                // Triggered once all uploaded files are processed by Busboy.
                // We still need to wait for the disk writes (saves) to complete.
                busboy.on('finish', async () => {
                    await Promise.all(fileWrites);
                    const storage = admin.storage();
                    let uploadError = '';
                    let result = {};
                    let bucket = storage.bucket();
                    if (!bucket) {
                        console.log('Missing bucket');
                        uploadError = 'Missing default bucket';
                    }
                    if (bucket) {
                        for (const file in uploads) {
                            console.log('Saving data: ', file);
                            const uploadFile = uploads[file];
                            bucketUploads.push(
                                bucket.upload(uploadFile.filepath, {
                                    destination: uploadFile.destFilePath,
                                    contentType: uploadFile.mimeType,
                                    public: true,
                                    // Optional:
                                    // Set a generation-match precondition to avoid potential race conditions
                                    // and data corruptions. The request to upload is aborted if the object's
                                    // generation number does not match your precondition. For a destination
                                    // object that does not yet exist, set the ifGenerationMatch precondition to 0
                                    // If the destination object already exists in your bucket, set instead a
                                    // generation-match precondition using its generation number.
                                    preconditionOpts: {ifGenerationMatch: 0}
                                }).then(([storageFile]) => {
                                    result[file] = storageFile.publicUrl();
                                })
                            );
                        }
                        try {
                            await Promise.all(bucketUploads);
                        } catch (e) {
                            uploadError = e.message;
                        }
                    }
                    for (const file in uploads) {
                        const uploadFile = uploads[file];
                        fs.unlinkSync(uploadFile.filepath);
                    }
                    if (uploadError) {
                        res.status(500).json({error: uploadError});
                    } else {
                        res.status(200).json(result);
                    }
                });

                busboy.end(req.rawBody);
            } else {
                res.send("Not Post");
            }
        }
    })
});

// {
// >    host: '0.0.0.0:5001',
// >    connection: 'keep-alive',
// >    'content-length': '95494',
// >    pragma: 'no-cache',
// >    'cache-control': 'no-cache',
// >    'upgrade-insecure-requests': '1',
// >    origin: 'http://localhost:3000',
// >    'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryQzu6FYNF36cqqLhr',
// >    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
// >    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
// >    referer: 'http://localhost:3000/',
// >    'accept-encoding': 'gzip, deflate',
// >    'accept-language': 'en-US,en;q=0.9'
// >  }
//
// {
// >    host: '0.0.0.0:5001',
// >    connection: 'keep-alive',
// >    'content-length': '265',
// >    pragma: 'no-cache',
// >    'cache-control': 'no-cache',
// >    'access-control-allow-origin': '*',
// >    accept: 'application/json, text/plain, */*',
// >    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
// >    'content-type': 'multipart/form-data; boundary=----WebKitFormBoundarysl6SAGrnc8UIBbM2',
// >    origin: 'http://localhost:3000',
// >    referer: 'http://localhost:3000/',
// >    'accept-encoding': 'gzip, deflate',
// >    'accept-language': 'en-US,en;q=0.9'
// >  }
