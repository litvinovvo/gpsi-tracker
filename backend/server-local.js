require('dotenv').config();
const {Firestore} = require('@google-cloud/firestore');

const db = new Firestore();
const collection = 'User';

async function list(limit, token) {
    const snapshot = await db
      .collection(collection)
      .orderBy('id')
      .startAfter(token || '')
      .limit(limit)
      .get();
  
    if (snapshot.empty) {
      return {
        users: [],
        nextPageToken: false,
      };
    }
    const users = [];
    snapshot.forEach(doc => {
      let user = doc.data();
      user.id = doc.id;
      users.push(user);
    });
    // get next page token
    const q = await snapshot.query.offset(limit).get();
  
    return {
        users,
        nextPageToken: q.empty ? false : users[users.length - 1].id,
    };
  }
  
  // Creates a new book or updates an existing book with new data.
  async function update(id, data) {
    let ref;
    if (id === null) {
      ref = db.collection(collection).doc();
    } else {
      ref = db.collection(collection).doc(id);
    }
  
    data.id = ref.id;
    data = {...data};
    await ref.set(data);
    return data;
  }
  
  async function updateProject(userId, projectId, data) {
    let ref;
    const projectCollection = 'project';
    if (projectId === null) {
      ref = db.collection(collection).doc(userId).collection(projectCollection).doc();
    } else {
      ref = db.collection(collection).doc(userId).collection(projectCollection).doc(projectId);
    }
  
    data.id = ref.id;
    data = {...data};
    await ref.set(data);
    return data;
  }

  async function create(data) {
    return await update(null, data);
  }

  async function createProject(userId, data) {
    return await updateProject(userId, null, data);
  }
  
  // [START bookshelf_firestore_client_get_book]
  async function read(id) {
    const doc = await db
      .collection(collection)
      .doc(id)
      .get();
  
    if (!doc.exists) {
      throw new Error('No such document!');
    }
    return doc.data();
  }
  // [END bookshelf_firestore_client_get_book]
  
  async function _delete(id) {
    await db
      .collection(collection)
      .doc(id)
      .delete();
  }

  // testing

  console.log('test');
  (async () => {
    //   await create({ email: 'a@a.com' });
    
    await createProject('RkAoM8hNE6MBd0vYB4Zz', {name: 'demo websites'});
    const users = await list(10);
    console.log('users', users);
  })();