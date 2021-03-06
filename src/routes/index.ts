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
import express = require('express');
import csurf = require('csurf');

export var index = function(req: express.Request, res: express.Response, next: Function) {
    var username: string = (<Express.Request>req).session[prjs.sessions.loginKey];
    res.render('index', { username: username, csrfToken: (<Express.Request>req).csrfToken() });
};
