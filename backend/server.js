const express = require('express');
const metadata = require('gcp-metadata');
const { OAuth2Client } = require('google-auth-library');
const {google} = require('googleapis');
var fs = require('fs'),
    path = require('path'),
    filePath = path.join(__dirname, 'service-account-key.json');

const app = express();
const oAuth2Client = new OAuth2Client();
const authClient = new google.auth.GoogleAuth({
  // keyFile: '/path/to/your-secret-key.json',
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
});
const people = google.people({
  version: 'v1',
  auth: authClient,
});

// Cache externally fetched information for future invocations
let aud;

// [START getting_started_auth_metadata]
async function audience() {
  if (!aud && (await metadata.isAvailable())) {
    let project_number = await metadata.project('numeric-project-id');
    let project_id = await metadata.project('project-id');

    aud = '/projects/' + project_number + '/apps/' + project_id;
  }

  return aud;
}
// [END getting_started_auth_metadata]

// [START getting_started_auth_audience]
async function validateAssertion(assertion) {
  if (!assertion) {
    return {};
  }

  // Check that the assertion's audience matches ours
  const aud = await audience();

  // Fetch the current certificates and verify the signature on the assertion
  // [START getting_started_auth_certs]
  const response = await oAuth2Client.getIapPublicKeys();
  // [END getting_started_auth_certs]
  const ticket = await oAuth2Client.verifySignedJwtWithCertsAsync(
      assertion,
      response.pubkeys,
      aud,
      ['https://cloud.google.com/iap']
  );
  const payload = ticket.getPayload();

  return payload;
}
// [END getting_started_auth_audience]

// [START getting_started_auth_front_controller]
app.get('/api/user/', async (req, res) => {
  const assertion = req.header('X-Goog-IAP-JWT-Assertion');
  let email = 'None';
  try {
    const info = await validateAssertion(assertion);
    const userId = req.header('X-Goog-Authenticated-User-ID').split(':')[1];
    email = info.email;
    console.log('user', info);
    // console.log(process.env);
    //
    // fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
    //   if (!err) {
    //     console.log('received data: ' + data);
    //   } else {
    //     console.log(err);
    //   }
    // });

    // google.options({auth});

    const profile = await people.people.get({
      resourceName: `people/${userId}`,
      personFields: 'emailAddresses,names,photos',
    });

    console.log('profile', profile);



  } catch (error) {
    console.log(error);
  }
  res
      .status(200)
      .send(`Hello ${email}`)
      .end();
});

// [END getting_started_auth_front_controller]

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

// [END getting_started_auth_all]

module.exports = app;
