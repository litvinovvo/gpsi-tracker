'use strict';

const express = require('express');
const bodyParser = require('body-parser');
// const images = require('../lib/images');
const db = require('./firestore');
const queue = require('./queue');
const router = express.Router();

// Automatically parse request body as form data
router.use(bodyParser.urlencoded({extended: false}));

// Set Content-Type for all responses for these routes
router.use((req, res, next) => {
    res.set('Content-Type', 'text/html');
    next();
});

/**
 * GET /projects
 *
 * Display a page of projects (up to ten at a time).
 */
router.get('/', async (req, res) => {
    console.log('user:', req.userId);
    let {projects, nextPageToken} = await db.list(req.userId, 10, req.query.pageToken);
    const user =  { userId: req.userId };
    res.render('projects/list.pug', {
        projects,
        user,
        nextPageToken,
    });
});

/**
 * GET /projects/add
 *
 * Display a form for creating a project.
 */
router.get('/add', (req, res) => {
    const user =  { userId: req.userId };
    res.render('projects/form.pug', {
        project: {},
        user,
        action: 'Add',
    });
});

/**
 * POST /projects/add
 *
 * Create a project.
 */
// [START add]
router.post(
    '/add',
    // images.multer.single('image'),
    // images.sendUploadToGCS,
    async (req, res) => {
        let data = req.body;

        // Was an image uploaded? If so, we'll use its public URL
        // in cloud storage.
        // if (req.file && req.file.cloudStoragePublicUrl) {
        //     data.imageUrl = req.file.cloudStoragePublicUrl;
        // }

        // Save the data to the database.
        const savedData = await db.create(req.userId, data);
        res.redirect(`${req.baseUrl}/${savedData.id}`);
    }
);
// [END add]


/**
 * GET /projects/:id/pages/add
 *
 * Display a form for creating a page.
 */
router.get('/:id/pages/add', (req, res) => {
    const user =  { userId: req.userId };
    res.render('pages/form.pug', {
        page: {},
        user,
        action: 'Add',
    });
});

/**
 * POST /projects/:id/pages/add
 *
 * Create a page in the project.
 */
// [START add]
router.post(
    '/:id/pages/add',
    // images.multer.single('image'),
    // images.sendUploadToGCS,
    async (req, res) => {
        let data = req.body;

        // Save the data to the database.
        const savedData = await db.createPage(req.userId, req.params.id, data);
        res.redirect(`${req.baseUrl}/${req.params.id}`);
    }
);
// [END add]

/**
 * GET /projects/:id/edit
 *
 * Display a project for editing.
 */
router.get('/:project/edit', async (req, res) => {
    const project = await db.read(req.userId, req.params.project);
    const user =  { userId: req.userId };
    res.render('projects/form.pug', {
        project,
        user,
        action: 'Edit',
    });
});

/**
 * POST /projects/:id/edit
 *
 * Update a project.
 */
router.post(
    '/:project/edit',
    // images.multer.single('image'),
    // images.sendUploadToGCS,
    async (req, res) => {
        let data = req.body;

        // Was an image uploaded? If so, we'll use its public URL
        // in cloud storage.
        // if (req.file && req.file.cloudStoragePublicUrl) {
        //     req.body.imageUrl = req.file.cloudStoragePublicUrl;
        // }
        console.log('update');
        const savedData = await db.update(req.userId, req.params.project, data);
        console.log('updated, redirect', savedData);
        res.redirect(`${req.baseUrl}/${savedData.id}`);
    }
);

/**
 * GET /projects/:id
 *
 * Display a project.
 */
router.get('/:project', async (req, res) => {
    // TODO: do it in one db request
    const project = await db.read(req.userId, req.params.project);
    const { pages, nextPageToken } = await db.listPages(req.userId, req.params.project, 10, req.query.pageToken);
    const user =  { userId: req.userId };
    res.render('projects/view.pug', {
        project,
        pages,
        scores: [],
        nextPageToken,
        user,
    });
});

/**
 * GET /projects/:id/pages/:id
 *
 * Display a page with last data.
 */
router.get('/:project/pages/:page', async (req, res) => {
    // TODO: do it in one db request
    console.log('getting page data');
    const project = await db.read(req.userId, req.params.project);
    const { pages, nextPageToken } = await db.listPages(req.userId, req.params.project, 10, req.query.pageToken);
    const scores = await db.listScores(
        req.userId, req.params.project,
        req.params.page, 30
    );
    const user =  { userId: req.userId };
    console.log('render');
    res.render('projects/view.pug', {
        project,
        pages,
        scores,
        selectedPage: req.params.page,
        nextPageToken,
        user,
    });
});

/**
 * GET /projects/:id/delete
 *
 * Delete a project.
 */
router.get('/:project/delete', async (req, res) => {
    await db.delete(req.userId, req.params.project);
    res.redirect(req.baseUrl);
});

/**
 * GET /projects/:id/run
 *
 * Run a project.
 */
router.get('/:project/run', async (req, res) => {
    const { key, requestsPerRun } = await db.read(req.userId, req.params.project);
    const { pages } = await db.listPages(req.userId, req.params.project, 10, req.query.pageToken);

    pages.forEach(page => {
        console.log('push into queue', key, req.userId, req.params.project, page.id, page.link);
        queue.push(key,req.userId, req.params.project, page.id, page.link);
    });
    // new Array(10).fill(1,0,10).forEach()
    // await queue.push(key,req.userId, req.params.project,  );
    // res.redirect(`${req.baseUrl}/${req.params.project}`);
    res.redirect('back');
});

/**
 * GET /projects/:projectId/pages/:pageId/delete
 *
 * Delete a page from a project.
 */
router.get('/:project/pages/:page/delete', async (req, res) => {
    await db.deletePage(req.userId, req.params.project, req.params.page);
    res.redirect(`${req.baseUrl}/${req.params.project}`);
});

module.exports = router;
