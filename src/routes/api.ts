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
    logger.info(util.format('User %d try to get user pull requests', userId));
    async.waterfall([
        function(callback) {
            var dba: db.DB = new db.DB(options.mongo.host, options.mongo.port, options.mongo.db);
            dba.getUserRepositories(userId, function(err, repoNames) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, repoNames);
                }
            });
        },
        function (repoNames, callback) {
            var repos = repoNames.map(function(repoName, index) {
                return {
                    name: repoName,
                    pulls: [
                        {
                            title: 'test1',
                            number: 123,
                            user: {login: 'user1'},
                            html_url: 'https://github.com/mtgto/test/pulls/1'
                        },
                        {
                            title: 'test2',
                            number: 45,
                            user: {login: 'user2'},
                            html_url: 'https://github.com/mtgto/test/pulls/1'
                        }
                    ]
                };
            });
            callback(null, repos);
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
    var owner:string = req.body['owner'];
    var repo:string = req.body['repo'];
    logger.info(util.format('User %d try to add repository %s/%s', userId, owner, repo));
    async.waterfall([
        function(callback) {
            var accessToken:string = (<Express.Request>req).session[prjs.sessions.accessTokenKey];
            var client = new github.Client(options.github.apiUrl, options.github.userAgent, accessToken);
            client.getPullRequests(owner, repo, function (err, pulls) {
                if (err) {
                    callback(err);
                } else {
                    logger.info('pulls = ' + JSON.stringify(pulls));
                    callback(null, pulls);
                }
            });
        },
        function(pulls, callback) {
            var dba: db.DB = new db.DB(options.mongo.host, options.mongo.port, options.mongo.db);
            dba.addUserRepository(userId, owner + '/' + repo, function(err, result) {
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
            console.log('AAAA' + JSON.stringify(result));
            var pulls = result[0];
            var success = result[1];
            if (success) {
                res.json({name: owner + '/' + repo, pulls: pulls});
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
    var owner:string = req.body['owner'];
    var repo:string = req.body['repo'];
    logger.info(util.format('User %d try to delete repository %s/%s', userId, owner, repo));
    async.waterfall([
        function(callback) {
            var accessToken:string = (<Express.Request>req).session[prjs.sessions.accessTokenKey];
            var client = new github.Client(options.github.apiUrl, options.github.userAgent, accessToken);
            client.getPullRequests(owner, repo, function (err, pulls) {
                if (err) {
                    callback(err);
                } else {
                    logger.info('pulls = ' + JSON.stringify(pulls));
                    callback(null, pulls);
                }
            });
        },
        function(pulls, callback) {
            var dba: db.DB = new db.DB(options.mongo.host, options.mongo.port, options.mongo.db);
            dba.deleteUserRepository(userId, owner + '/' + repo, function(err, result?: boolean) {
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
                res.json({name: owner + '/' + repo, pulls: pulls});
            } else {
                res.status(404);
                res.json({message: 'not found'});
            }
        }
    });
};