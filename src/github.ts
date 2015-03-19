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
import util = require('util');

export interface APIRequestHandler {
    (err: any, result: any): any;
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
            } else if (response.statusCode == 200) {
                callback(null, JSON.parse(body));
            } else {
                callback(new prjs.HTTPError(response.statusCode, "Failed to get your information via GitHub API."), null);
            }
        });
    }

    getPullRequests(repositoryName: string, callback: APIRequestHandler) {
        var matches = repositoryName.match(/(\S+)\/(\S+)/);
        if (matches.length == 3) {
            var owner = matches[1];
            var repo = matches[2];
            var apiUrl:string = url.resolve(this.apiUrl, util.format('repos/%s/%s/pulls', owner, repo));
            var headers: request.Headers = this.getHeaders();
            var options:request.Options = {headers: headers};
            request.get(apiUrl, options, function (error, response, body) {
                if (error) {
                    logger.warn('GitHub API returns error: %s, response: %s, body: %s', [error, response, body]);
                    callback(new prjs.HTTPError(response.statusCode, "Failed to get pull requests."), null);
                } else {
                    if (response.statusCode == 200) {
                        callback(null, JSON.parse(body));
                    } else {
                        callback(new prjs.HTTPError(response.statusCode, "Failed to get pull requests."), null);
                    }
                }
            });
        } else {
            callback(Error("Invalid repository name"), null);
        }
    }

    private getHeaders(): request.Headers {
        return {
            'Accept': 'application/json',
            'Authorization': 'token ' + this.accessToken,
            'User-Agent': this.userAgent
        };
    }
}
