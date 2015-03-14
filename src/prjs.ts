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

/**
 * Application configurations
 */
export interface Options {
    github: { publicUrl: string; apiUrl: string; clientId: string; clientSecret: string; userAgent: string };
    redis: { host: string; port: number; password?: string };
    mongo: { host: string; port: number; db: string };
    secret: string;
    maxRepositories: number;
}

export module sessions {
    export var csrfTokenKey: string = 'csrf_token';
    export var accessTokenKey: string = 'access_token';
    export var userIdKey: string = 'user_id';
    export var loginKey: string = 'login';
}

export var HTTPError = function(code: number, message: string) {
    this.code = code;
    this.message = message;
};

HTTPError.prototype = new Error();
HTTPError.prototype.constructor = HTTPError;
HTTPError.prototype.getCode = (): number => {
    return this.code;
};
