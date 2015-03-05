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

/// <reference path="../../typings/tsd.d.ts"/>
import prjs = require('../prjs');
import db = require('../db');
import github = require('../github');
import express = require('express');
import request = require('request');
import async = require('async');
import logger = require('winston');
import util = require('util');

export var index = function(req: express.Request, res: express.Response, next: Function) {
    var options: prjs.Options = res.locals.options;
    var code: string = req.query.code;
    async.waterfall([
        function(callback) {
            // check whether user request is valid.
            var sessionToken: string = (<Express.Request>req).session[prjs.sessions.csrfTokenKey];
            var token: string = req.query.state;
            if (token != sessionToken) {
                logger.info(util.format('Failed to One-Time-Token check. It might be CSRF attack: session: %s, request: %s', sessionToken, token));
                callback(new prjs.HTTPError(400, "Bad Request"));
            } else if (!code) {
                logger.info('No code found in user request. It might be attack.');
                callback(new prjs.HTTPError(400, "Bad Request"));
            } else {
                callback(null);
            }
        },
        function(callback) {
            // Send HTTP Request to get new GitHub accessToken.
            var tokenUrl:string = require('url').resolve(options.github.publicUrl, 'login/oauth/access_token');
            var formData = {
                client_id: options.github.clientId,
                client_secret: options.github.clientSecret,
                code: code
            };
            var headers:request.Headers = {
                'Accept': 'application/json',
                'User-Agent': options.github.userAgent
            };
            var requestOptions:request.Options = {form: formData, headers: headers};
            request.post(tokenUrl, requestOptions, function (error, response, body) {
                if (error) {
                    logger.warn(util.format('Failed to get GitHub access token. error: %s, response: %s, body: %s', error, response, body));
                    callback(new prjs.HTTPError(500, "Internal Server Error"));
                }
                callback(null, JSON.parse(body)['access_token']);
            });
        },
        function(accessToken, callback) {
            // Get user information by using GitHub API.
            var client = new github.Client(options.github.apiUrl, options.github.userAgent, accessToken);
            client.getUser(function(err, user) {
                if (err) {
                    callback(err);
                } else {
                    logger.info(util.format('Succeeded to get user information: %s', user));
                    callback(null, accessToken, user);
                }
            });
        },
        function(accessToken, user, callback) {
            // Store into MongoDB.
            var userId: number = user['id'];
            var login: string = user['login'];
            logger.info(util.format('Login user: id=%d, login=%s', user.id, user.login));
            var dba: db.DB = new db.DB(options.mongo.host, options.mongo.port, options.mongo.db);
            dba.addUser(userId, login, [], function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, accessToken, userId, login);
                }
            });
        },
        function(accessToken, userId: number, login: string, callback) {
            // Set access token to session, and delete csrf token.
            var session: Express.Session = (<Express.Request>req).session;
            session[prjs.sessions.accessTokenKey] = accessToken;
            delete session[prjs.sessions.csrfTokenKey];
            session[prjs.sessions.userIdKey] = String(userId);
            session[prjs.sessions.loginKey] = login;
            callback(null);
        }
    ], function(err) {
        if (err) {
            next(err);
        } else {
            res.redirect('/');
        }
    });
};
