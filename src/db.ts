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
import mongo = require('mongodb');
import logger = require('winston');
import util = require('util');

export interface User {
    id: number;
    login: string;
    /**
     * Repositories which this user is reviewing. format: ":orgs/:repo"
     */
    repos: string[];
}

export class DB {
    host: string;
    port: number;
    dbname: string;
    username: string;
    password: string;

    constructor(host: string, port: number, dbname: string, username?: string, password?: string) {
        this.host = host;
        this.port = port;
        this.dbname = dbname;
        this.username = username;
        this.password = password;
    }

    public addUser(userId: number, login: string, callback: (error) => void) {
        this.getDB(function(err, db) {
            if (err) {
                callback(err);
            } else {
                db.collection('users', function(error, users) {
                    if (error) {
                        logger.warn('Failed to set up to use users database.');
                        callback(error);
                    } else {
                        users.update(
                            {id: userId},
                            {
                                '$set': {'login': login}
                            },
                            {upsert: true},
                            function(error, user) {
                                if (error) {
                                    logger.warn(util.format('Failed to update users database: id=%d, login: %s', userId, login));
                                    callback(error);
                                } else {
                                    callback(null);
                                }
                            }
                        );
                    }

                });
            }
        });
    }

    public addUserRepository(userId: number, repository: string, callback: (error, result?: boolean) => void) {
        this.getDB(function(err, db) {
            if (err) {
                callback(err);
            } else {
                db.collection('users', function(error, users) {
                    if (error) {
                        logger.warn('Failed to set up to use users database.');
                        callback(error);
                    } else {
                        users.update(
                            {id: userId},
                            {
                                '$addToSet': {'repos': repository}
                            },
                            {},
                            function(error, result) {
                                if (error) {
                                    logger.warn(util.format('Failed to update users database: id=%d, repository: %s', userId, repository));
                                    callback(error);
                                } else {
                                    callback(null, result['result']['nModified'] == 1);
                                }
                            }
                        );
                    }

                });
            }
        });
    }

    public deleteUserRepository(userId: number, repository: string, callback: (error, result?: boolean) => void) {
        this.getDB(function(err, db) {
            if (err) {
                callback(err);
            } else {
                db.collection('users', function(error, users) {
                    if (error) {
                        logger.warn('Failed to set up to use users database.');
                        callback(error);
                    } else {
                        users.update(
                            {id: userId},
                            {
                                '$pull': {'repos': repository}
                            },
                            {},
                            function(error, result) {
                                if (error) {
                                    logger.warn(util.format('Failed to update users database: id=%d, repository: %s', userId, repository));
                                    callback(error);
                                } else {
                                    callback(null, result['result']['nModified'] == 1);
                                }
                            }
                        );
                    }

                });
            }
        });
    }

    public getUserRepositories(userId: number, callback: (error, repositories?: string[]) => void) {
        this.getDB(function(err, db) {
            if (err) {
                callback(err);
            } else {
                db.collection('users', function(error, users) {
                    if (error) {
                        logger.warn('Failed to set up to use users database.');
                        callback(error);
                    } else {
                        users.findOne(
                            {id: userId},
                            function(error, user) {
                                if (error) {
                                    logger.warn(util.format('Failed to get an user database: id=%d', userId));
                                    callback(error);
                                } else if (user) {
                                    callback(null, user.repos || []);
                                } else {
                                    logger.warn(util.format('No user found. id=%d', userId));
                                    callback(new Error('No user found'));
                                }
                            }
                        );
                    }

                });
            }
        });
    }

    private getDB(callback: (err, db: mongo.Db) => void) {
        var server = new mongo.Server(this.host, this.port, {auto_reconnect: true});
        var db = new mongo.Db(this.dbname, server, { w: 1 });
        db.open(function(err, db) {
            if (this.username && this.password) {
                logger.info("Authenticate to Mongo");
                db.authenticate(this.username, this.password, function(err) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, db);
                    }
                });
            } else {
                logger.info("No authenticate to Mongo");
                callback(err, db);
            }
        })
    }
}
