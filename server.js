// Was able to setup functionally datastore emulator!
// To connect to it instead of datastore when local, run $(gcloud beta emulators datastore env-init)
const {BoatHandlers} = require('./handlers/boat.js');
const boatHandlers = new BoatHandlers();
const {SlipHandlers} = require('./handlers/slip.js');
const slipHandlers = new SlipHandlers();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const slip = require('./datastore/slip.js');

const router = express.Router();

app.use(bodyParser.json());
app.set('port', 8080);

//Basic documentation, not required but I think it adds a lot
router.get('/', function(req, res) {
    res.sendFile(__dirname + "/static/index.html");
});
router.get('/documentation', function(req, res) {
    res.sendFile(__dirname + "/static/hw3-api-doc.pdf");
});

//Set up the boat routes
router.post('/boats', boatHandlers.postBoat);
router.get('/boats/:id', boatHandlers.getBoat)
router.get('/boats', boatHandlers.getBoats);
router.delete('/boats/:id', boatHandlers.deleteBoat);

//Start up the server
app.use(router);
app.listen(app.get('port'), function() {
    console.log('Web server has begun running on port ' + app.get('port') + '; press Ctrl+C to terminate.');
});