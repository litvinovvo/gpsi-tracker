// Copyright 2017, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const express = require('express');

const app = express();

app.set('views', require('path').join(__dirname, 'views'));
app.set('view engine', 'pug');

// projects
// userId middleware
app.use(function (req, res, next) {
    const userId = req.header('X-Goog-Authenticated-User-ID') ?
        req.header('X-Goog-Authenticated-User-ID').split(':')[1] : 'test';
    console.log('set user', userId);

    req.userId = userId;
    next();
})
app.use('/projects', require('./projects/crud'));
app.use('/api/projects', require('./projects/api'));

// Redirect root to /projects
app.get('/', (req, res) => {
    res.redirect('/projects');
});

app.get('/errors', () => {
    throw new Error('Test exception');
});

app.get('/logs', (req, res) => {
    console.log('Hey, you triggered a custom log entry. Good job!');
    res.sendStatus(200);
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

module.exports = app;
