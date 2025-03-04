const {BoatHandlers} = require('./handlers/boat.js');
const boatHandlers = new BoatHandlers();
const {LoadHandlers} = require('./handlers/load.js');
const loadHandlers = new LoadHandlers();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const router = express.Router();

app.use(bodyParser.json());
app.set('port', 8080);

ROOT_URL = 'https://anderja8-marina-load-manager.appspot.com';
BOAT_DATASTORE_KEY = "boats";
BOAT_PAGINATION_SIZE = 3;
LOAD_DATASTORE_KEY = "loads";
LOAD_PAGINATION_SIZE = 3;

//Basic documentation, not required but I think it adds a lot
router.get('/', function(req, res) {
    res.sendFile(__dirname + "/static/index.html");
});
router.get('/documentation', function(req, res) {
    res.sendFile(__dirname + "/static/anderja8_load.pdf");
});
router.get('/pmcollection', function(req, res) {
    res.sendFile(__dirname + "/static/anderja8.postman_collection.json");
});
router.get('/pmenvironment', function(req, res) {
    res.sendFile(__dirname + "/static/anderja8.postman_environment.json");
});

//Set up the boat routes
router.post('/boats', boatHandlers.postBoat);
router.get('/boats/:id', boatHandlers.getBoat)
router.get('/boats', boatHandlers.getBoats);
router.delete('/boats/:id', boatHandlers.deleteBoat);
router.get('/boats/:id/loads', boatHandlers.getBoatLoads);

//Set up the load routes
router.post('/loads', loadHandlers.postLoad);
router.get('/loads/:id', loadHandlers.getLoad)
router.get('/loads', loadHandlers.getLoads);
router.delete('/loads/:id', loadHandlers.deleteLoad);

//Set up the linking routes
router.put('/loads/:load_id/boats/:boat_id', loadHandlers.linkLoad);
router.delete('/loads/:load_id/boats/:boat_id', loadHandlers.unlinkLoad);

//Start up the server
app.use(router);
app.listen(app.get('port'), function() {
    console.log('Web server has begun running on port ' + app.get('port') + '; press Ctrl+C to terminate.');
});