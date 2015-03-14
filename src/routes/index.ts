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
import express = require('express');
import csurf = require('csurf');

export var index = function(req: express.Request, res: express.Response, next: Function) {
    var options: prjs.Options = res.locals.options;
    var userId: number = parseInt((<Express.Request>req).session[prjs.sessions.userIdKey]);
    var dba: db.DB = new db.DB(options.mongo.host, options.mongo.port, options.mongo.db);
    dba.getUserRepositories(userId, function(err, repoNames) {
        if (err) {
            next(err);
        } else {
            var repos: { [s: string]: [any] } = {
                'mtgto/test': [
                    {title: 'test1', number: 123, user: {login: 'user1'}, html_url: 'https://github.com/mtgto/test/pulls/1'},
                    {title: 'test2', number: 45, user: {login: 'user2'}, html_url: 'https://github.com/mtgto/test/pulls/1'}
                ],
                'mtgto/test2': [
                    {title: 'test1', number: 123, user: {login: 'user1'}, html_url: 'https://github.com/mtgto/test/pulls/1'},
                    {title: 'test2', number: 45, user: {login: 'user2'}, html_url: 'https://github.com/mtgto/test/pulls/1'}
                ]
            };
            res.render('index', { title: 'Index', repos: repos, csrfToken: (<Express.Request>req).csrfToken() });
        }
    });
};
