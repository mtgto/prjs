/*
 * Copyright 2015 mtgto <hogerappa@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/// <reference path="../typings/tsd.d.ts"/>
import prjs = require('./prjs');
import db = require('./db');
import express = require('express');
import session = require('express-session');
import i18n = require('i18n');
import path = require('path');
import url = require('url');
import querystring = require('querystring');
import crypto = require('crypto');
var RedisStore = require('connect-redis')(session);

var app: express.Application = express();

app.locals.options = <prjs.Options>{
    github: {
        publicUrl: process.env.GITHUB_PUBLIC_URL || 'https://github.com/',
        apiUrl: process.env.GITHUB_PUBLIC_URL || 'https://api.github.com/',
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        userAgent: process.env.GITHUB_USERAGENT || 'prjs'
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    },
    mongo: {
        host: process.env.MONGO_HOST || 'localhost',
        port: process.env.MONGO_PORT || 27017,
        db: process.env.MONGO_DB || 'prjs'
    },
    secret: process.env.SECRET || 'secret'
};

i18n.configure(<i18n.ConfigurationOptions>{
    locales: ['en', 'ja'],
    defaultLocale: 'en',
    directory: path.join(__dirname, '/locales')
});

// setup view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(<express.RequestHandler>i18n.init);
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(__dirname + 'public'));

// Setup session
app.use(session({
    store: new RedisStore({
        host: app.locals.options.redis.host,
        port: app.locals.options.redis.port
    }),
    secret: app.locals.options.secret,
    resave: false,
    saveUninitialized: false
}));

// local settings
app.use(function(req: express.Request, res: express.Response, next: Function) {
    res.locals.options = app.locals.options;
    next();
});

var loginCheck: express.RequestHandler = function(req: express.Request, res: express.Response, next: Function) {
    if ((<Express.Request>req).session[prjs.sessions.userIdKey]) {
        next();
    } else {
        var randomString: string = crypto.randomBytes(16).toString('hex');
        var query: string = querystring.stringify(
            {
                client_id: res.locals.options.github.clientId,
                scope: 'repo',
                state: randomString
            }
        );
        var loginUrl: string = url.resolve(res.locals.options.github.publicUrl, 'login/oauth/authorize?' + query);
        (<Express.Request>req).session[prjs.sessions.csrfTokenKey] = randomString;
        res.render('login', { loginUrl: loginUrl});
    }
};

// routing
app.get('/', loginCheck, function (req: express.Request, res: express.Response, next: Function) {
    var options: prjs.Options = res.locals.options;
    var userId: number = parseInt((<Express.Request>req).session[prjs.sessions.userIdKey]);
    var dba: db.DB = new db.DB(options.mongo.host, options.mongo.port, options.mongo.db);
    dba.getUserRepositories(userId, function(err, repos) {
       if (err) {
           next(err);
       } else {
           res.render('index', { title: repos });
       }
    });
});

import authenticate = require('./routes/authenticate');
app.get('/authenticate', authenticate.index);

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err: any, req: express.Request, res: express.Response, next: Function) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err: any, req: express.Request, res: express.Response, next: Function) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
