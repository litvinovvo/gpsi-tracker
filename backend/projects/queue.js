const TOPIC_NAME = 'score';
const {PubSub} = require('@google-cloud/pubsub');
const pubsub = new PubSub();
const topic = pubsub.topic(TOPIC_NAME);

const {getScore} = require('./../functions/getScore');

async function push(key, userId, projectId, pageId, url) {
    const buffer = Buffer.from(JSON.stringify({key, userId, projectId, pageId, url}));
    // topic.publish(buffer);
    getScore({ data: buffer });
}

module.exports = {
    push,
}
