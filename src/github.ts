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
import url = require('url');
import request = require('request');
import async = require('async');
import logger = require('winston');

export interface APIRequestHandler {
    (err: any, next: Function): any;
}

export class Client {
    apiUrl: string;
    userAgent: string;
    accessToken: string;

    constructor(apiUrl: string, userAgent: string, accessToken: string) {
        this.apiUrl = apiUrl;
        this.userAgent = userAgent;
        this.accessToken = accessToken;
    }

    getUser(callback: APIRequestHandler) {
        var apiUrl:string = url.resolve(this.apiUrl, 'user');
        var headers: request.Headers = this.getHeaders();
        var options:request.Options = {headers: headers};
        request.get(apiUrl, options, function (error, response, body) {
            if (error) {
                logger.warn('GitHub API returns error: %s, response: %s, body: %s', [error, response, body]);
                callback(new prjs.HTTPError(response.statusCode, "Failed to get your information via GitHub API."), null);
            } else {
                callback(null, JSON.parse(body));
            }
        });
    }

    getPullRequests(orgs: string, repo: string, callback: APIRequestHandler) {
        callback(new prjs.HTTPError(500, "Not yet implemented."), null);
    }

    private getHeaders(): request.Headers {
        return {
            'Accept': 'application/json',
            'Authorization': 'token ' + this.accessToken,
            'User-Agent': this.userAgent
        };
    }
}
