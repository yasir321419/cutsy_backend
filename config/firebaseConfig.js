const admin = require('firebase-admin');
// const serviceAccount = require('../cutsy-d2183-firebase-adminsdk-fbsvc-a70d2493b9.json'); // adjust filename if needed

admin.initializeApp({
  // credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;