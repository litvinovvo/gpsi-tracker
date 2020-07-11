'use strict';

// [START projectshelf_firestore_client]
console.log('env:', process.env.NODE_ENV);
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const {Firestore} = require('@google-cloud/firestore');
const db = new Firestore();
const projectCollection = 'Project';
const userCollection = 'Account';
const pageCollection = 'Page';
const scoreCollection = 'Score'

// [END projectshelf_firestore_client]

// Lists all projects in the database sorted alphabetically by title.
async function list(userId, limit, token) {
    const snapshot = await db.collection(userCollection).doc(userId)
        .collection(projectCollection)
        .orderBy('title')
        .startAfter(token || '')
        .limit(limit)
        .get();

    if (snapshot.empty) {
        return {
            projects: [],
            nextPageToken: false,
        };
    }
    const projects = [];
    snapshot.forEach(doc => {
        let project = doc.data();
        project.id = doc.id;
        projects.push(project);
    });
    const q = await snapshot.query.offset(limit).get();

    return {
        projects,
        nextPageToken: q.empty ? false : projects[projects.length - 1].title,
    };
}

async function listPages(userId, projectId, limit, token) {
    const snapshot = await db.collection(userCollection).doc(userId)
        .collection(projectCollection).doc(projectId).collection(pageCollection)
        .orderBy('id')
        .startAfter(token || '')
        .limit(limit)
        .get();

    if (snapshot.empty) {
        return {
            pages: [],
            nextPageToken: false,
        };
    }
    const pages = [];
    snapshot.forEach(doc => {
        let page = doc.data();
        page.id = doc.id;
        pages.push(page);
    });
    const q = await snapshot.query.offset(limit).get();

    return {
        pages,
        nextPageToken: q.empty ? false : pages[pags.length - 1].id,
    };
}

async function listScores(userId, projectId, pageId, limit) {
    const snapshot = await db.collection(userCollection).doc(userId)
        .collection(projectCollection).doc(projectId)
        .collection(pageCollection).doc(pageId)
        .collection(scoreCollection)
        .limit(limit)
        .get();

    if (snapshot.empty) {
        return [];
    }
    const scores = [];
    snapshot.forEach(doc => {
        let score = doc.data();
        score.id = doc.id;
        scores.push(score);
    });

    return scores;
}

async function pushScore(userId, projectId, pageId, data) {
    let ref = db.collection(userCollection).doc(userId)
                .collection(projectCollection).doc(projectId)
                .collection(pageCollection).doc(pageId)
                .collection(scoreCollection).doc();

    data.id = ref.id;
    data = {...data};
    await ref.set(data);
    return data;
}

// Creates a new project or updates an existing project with new data.
async function update(userId, id, data) {
    console.log('update on db');
    let ref;
    if (id === null) {
        ref = db.collection(userCollection).doc(userId).collection(projectCollection).doc();
    } else {
        ref = db.collection(userCollection).doc(userId).collection(projectCollection).doc(id);
    }

    data.id = ref.id;
    data = {...data};
    await ref.set(data);
    return data;
}

async function create(userId, data) {
    return await update(userId, null, data);
}

// [START projectshelf_firestore_client_get_project]
async function read(userId, id) {
    const doc = await db.collection(userCollection).doc(userId)
        .collection(projectCollection)
        .doc(id)
        .get();

    if (!doc.exists) {
        throw new Error('No such document!');
    }
    return doc.data();
}
// [END projectshelf_firestore_client_get_project]

async function _delete(userId, id) {
    await db.collection(userCollection).doc(userId)
        .collection(projectCollection)
        .doc(id)
        .delete();
}

// Creates a new page or updates an existing page with new data.
async function updatePage(userId, projectId, pageId, data) {
    let ref;
    if (pageId === null) {
        ref = db.collection(userCollection).doc(userId)
            .collection(projectCollection).doc(projectId)
            .collection(pageCollection).doc();
    } else {
        ref = db.collection(userCollection).doc(userId)
            .collection(projectCollection).doc(projectId)
            .collection(pageCollection).doc(pageId);
    }

    data.id = ref.id;
    data = {...data};
    await ref.set(data);
    return data;
}

async function createPage(userId, projectId, data) {
    return await updatePage(userId, projectId, null, data);
}

async function _deletePage(userId, projectId, pageId) {
    await db.collection(userCollection).doc(userId)
        .collection(projectCollection).doc(projectId)
        .collection(pageCollection).doc(pageId)
        .delete();
}

module.exports = {
    create,
    read,
    update,
    delete: _delete,
    list,
    listPages,
    createPage,
    updatePage,
    deletePage: _deletePage,
    listScores,
    pushScore,
};

