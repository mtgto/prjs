/// <reference path="../typings/tsd.d.ts"/>
import express = require('express');

var app: express.Application = express();

app.get('/', function (req: express.Request, res: express.Response) {
    res.send('Hello World!')
});

module.exports = app;
