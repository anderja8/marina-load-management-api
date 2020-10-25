const {GCloudDatastore} = require('../datastore/datastore.js');
gCloudDatastore = new GCloudDatastore();
const { generateSelf } = require('./handlerFunctions.js');

class BoatHandlers {

    async postBoat(req, res) {
        //Verify that the required attributes are present
        if (!req.body.name || !req.body.type || !req.body.length) {
            return res.status(400).send({'Error': 'The request object is missing at least one of the required attributes'});
        }

        let newBoat = {
            "name": req.body.name,
            "type": req.body.type,
            "length": req.body.length,
        };

        let savedBoat = await gCloudDatastore.saveDoc(newBoat, BOAT_DATASTORE_KEY);
        savedBoat.loads = [];
        savedBoat = generateSelf(savedBoat, '/boats/' + savedBoat.id);
        return res.status(201).send(JSON.stringify(savedBoat));
    }

    async getBoat(req, res) {
        let boat = await gCloudDatastore.getDoc(req.params.id, BOAT_DATASTORE_KEY);
        if (boat === false) {
            return res.status(404).send({'Error': 'No boat with this boat_id exists'});
        }
        boat = await _getLoads(boat);
        boat = generateSelf(boat, '/boats/' + boat.id);
        return res.status(200).json(boat);
    }

    async getBoats(req, res) {
        const data = await gCloudDatastore.getDocsWithPagination(BOAT_DATASTORE_KEY, BOAT_PAGINATION_SIZE, req.query.endCursor);
        let boats = await Promise.all(data[0].map(async function(boat) {
            boat = await _getLoads(boat);
            return generateSelf(boat, '/boats/' + boat.id);
        }));

        const pageInfo = data[1];

        let retJSON = {
            "boats": boats
        }

        if (pageInfo.moreResults === true) {
            retJSON.next = ROOT_URL + '/boats?endCursor=' + pageInfo.endCursor;
        }

        return res.status(200).json(retJSON);
    }

    async deleteBoat(req, res) {
        const response = await gCloudDatastore.deleteDoc(req.params.id, BOAT_DATASTORE_KEY);
        if (response === false) {
            return res.status(404).send({'Error': 'No boat with this boat_id exists'});
        }
        return res.status(204).send();
    }

    //Deletes the boat with id = req.params.id. Fails if no boat with that id exists.
    //After deleting the boat, merges carrier of null into any loads where the carrier
    //matches the deleted boat id.
    async deleteBoat(req, res) {
        //Try to delete the boat
        let response = await gCloudDatastore.deleteDoc(req.params.id, BOAT_DATASTORE_KEY);
        if (response === false) {
            return res.status(404).send({'Error': 'No boat with this boat_id exists'});
        }

        //Asynchronously merge null carrier into all loads being carried by this boat
        let updatePromises = [];
        let boat = {"id": req.params.id};
        boat = _getLoads(boat)
        if (boat.loads) {
            boat.loads.forEach((load) => {
                const updatedData = ({"carrier": null});
                updatePromises = promises.push(gCloudDatastore.mergeDoc(LOAD_DATASTORE_KEY, load.id, updatedData));
            });
        }

        await Promise.all(updatePromises);
        return res.status(204).send();
    }
}

//Adds an array of loads assigned to this boatID to the boat object passed
async function _getLoads(boat) {
    boat.loads = [];
    let loads = await gCloudDatastore.getDocsWithAttribute(LOAD_DATASTORE_KEY, "carrier", "=", boat.id);
    loads.forEach((load) => {
        newLoadEntry = {
            "id":doc.id,
            "self": generateSelf(ROOT_URL, '/loads/' + doc.id)
        }
        boat.loads.push(newLoadEntry);
    });
    return boat;
}

module.exports = { BoatHandlers };