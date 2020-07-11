'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const db = require('./firestore');

const router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());

/**
 * GET /api/projects
 *
 * Retrieve a page of projects (up to ten at a time).
 */
router.get('/', async (req, res) => {
    const {projects, nextPageToken} = await db.list(req.userId, 10, req.query.pageToken);
    res.json({
        items: projects,
        nextPageToken,
    });
});

/**
 * POST /api/projects
 *
 * Create a new project.
 */
router.post('/', async (req, res) => {
    const project = await db.create(req.userId, req.body);
    res.json(project);
});

/**
 * GET /api/projects/:id
 *
 * Retrieve a project.
 */
router.get('/:project', async (req, res) => {
    const project = await db.read(req.userId, req.params.project);
    res.json(project);
});

/**
 * PUT /api/projects/:id
 *
 * Update a project.
 */
router.put('/:project', async (req, res) => {
    const project = await db.update(req.userId, req.params.project, req.body);
    res.json(project);
});

/**
 * DELETE /api/projects/:id
 *
 * Delete a project.
 */
router.delete('/:project', async (req, res) => {
    await db.delete(req.userId, req.params.project);
    res.status(200).send('OK');
});

/**
 * POST /api/projects/:id/pages/:id/scores
 *
 * Create a new score.
 */
router.post('/:project/pages/:page/scores', async (req, res) => {
    const score = await db.pushScore(req.userId, req.params.project, req.params.page, req.body);
    res.json(score);
});

module.exports = router;
