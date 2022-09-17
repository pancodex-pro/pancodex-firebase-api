exports.cors = require('cors')({
    // methods: [
    //     'GET','HEAD','POST','PUT','DELETE'
    // ],
    // allowedHeaders: [
    //     'Access-Control-Allow-Origin',
    //     'Access-Control-Allow-Headers',
    //     'Origin',
    //     'Accept',
    //     'X-Requested-With',
    //     'Content-Type',
    //     'Access-Control-Request-Method',
    //     'Access-Control-Request-Headers',
    //     'Access-Control-Allow-Credentials'
    // ],
    exposedHeaders: [
        'Content-Range',
        'X-Content-Range'
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    origin: '*',
    // origin: function (origin, callback) {
    //     if (whitelist.indexOf(origin) !== -1 || !origin) {
    //         callback(null, true)
    //     } else {
    //         callback(new Error('Not allowed by CORS'))
    //     }
    // }
});
