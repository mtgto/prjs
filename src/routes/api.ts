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
import logger = require('winston');
import async = require('async');
import util = require('util');

export var getPullRequests = function(req: express.Request, res: express.Response, next: Function) {
    var options:prjs.Options = res.locals.options;
    var userId:number = parseInt((<Express.Request>req).session[prjs.sessions.userIdKey]);
    var accessToken = (<Express.Request>req).session[prjs.sessions.accessTokenKey];
    logger.info(util.format('User %d try to get user pull requests', userId));
    async.waterfall([
        function(callback) {
            var dba: db.DB = new db.DB(options.mongo.host, options.mongo.port, options.mongo.db, options.mongo.username, options.mongo.password);
            dba.getUserRepositories(userId, function(err, repoNames) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, repoNames);
                }
            });
        },
        function (repoNames: [string], callback) {
            var client = new github.Client(options.github.apiUrl, options.github.userAgent, accessToken);
            async.series(repoNames.map(function (repoName: string) {
                return function (callback) {
                    client.getPullRequests(repoName, function(err, pulls) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(err, {name: repoName, pulls: pulls});
                        }
                    });
                };
            }), function (err, results) {
                callback(err, results);
            });
        }
    ], function(err, repos) {
        if (err) {
            next(err);
        } else {
            res.json(repos);
        }
    });
};

export var addRepository = function(req: express.Request, res: express.Response, next: Function) {
    var options:prjs.Options = res.locals.options;
    var userId:number = parseInt((<Express.Request>req).session[prjs.sessions.userIdKey]);
    var repositoryName = req.body['name'];
    logger.info(util.format('User %d try to add repository %s', userId, repositoryName));
    async.waterfall([
        function(callback) {
            var accessToken:string = (<Express.Request>req).session[prjs.sessions.accessTokenKey];
            var client = new github.Client(options.github.apiUrl, options.github.userAgent, accessToken);
            client.getPullRequests(repositoryName, function (err, pulls) {
                if (err) {
                    callback(err);
                } else {
                    logger.info('pulls = ' + JSON.stringify(pulls));
                    callback(null, pulls);
                }
            });
        },
        function(pulls, callback) {
            var dba: db.DB = new db.DB(options.mongo.host, options.mongo.port, options.mongo.db, options.mongo.username, options.mongo.password);
            dba.addUserRepository(userId, repositoryName, function(err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, [pulls, result]);
                }
            });
        }
    ], function(err, result) {
        if (err) {
            next(err);
        } else {
            var pulls = result[0];
            var success = result[1];
            if (success) {
                res.json({name: repositoryName, pulls: pulls});
            } else {
                res.status(409);
                res.json({message: 'already added'});
            }
        }
    });
};

export var deleteRepository = function(req: express.Request, res: express.Response, next: Function) {
    var options:prjs.Options = res.locals.options;
    var userId:number = parseInt((<Express.Request>req).session[prjs.sessions.userIdKey]);
    var repositoryName = req.body['name'];
    logger.info(util.format('User %d try to delete repository %s', userId, repositoryName));
    async.waterfall([
        function(callback) {
            var dba: db.DB = new db.DB(options.mongo.host, options.mongo.port, options.mongo.db, options.mongo.username, options.mongo.password);
            dba.deleteUserRepository(userId, repositoryName, function(err, result?: boolean) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        }
    ], function(err, result) {
        if (err) {
            next(err);
        } else {
            if (result) {
                res.json({name: repositoryName});
            } else {
                res.status(404);
                res.json({message: 'not found'});
            }
        }
    });
};
