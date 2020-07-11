if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const fetch = require('node-fetch');
const {Firestore} = require('@google-cloud/firestore');
const db = new Firestore();
const projectCollection = 'Project';
const userCollection = 'Account';
const pageCollection = 'Page';
const scoreCollection = 'Score';

// [END getting_started_background_translate_init]
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
// [START getting_started_background_translate]
// translate translates the given message and stores the result in Firestore.
// Triggered by Pub/Sub message.
exports.getScore = async pubSubEvent => {
    const { key, userId, projectId, pageId, url } = JSON.parse(
        Buffer.from(pubSubEvent.data, 'base64').toString()
    );
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&key=${key}`;
    const score = await fetch(`${apiUrl}&url=${encodeURIComponent(url)}`);
    const json = await score.json();
    console.log('get score in function', json);
    await pushScore(userId, projectId, pageId, json);
    console.log('score pushed to the db');
};
