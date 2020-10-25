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

        let savedBoat;
        try {
            savedBoat = await gCloudDatastore.saveDoc(newBoat, BOAT_DATASTORE_KEY);
        } catch (err) {
            return res.status(500).send({'Error': 'failed to save the new boat to the datastore: ' + err});
        }
        savedBoat.loads = [];
        savedBoat = generateSelf(savedBoat, '/boats/' + savedBoat.id);
        return res.status(201).send(JSON.stringify(savedBoat));
    }

    async getBoat(req, res) {
        let boat;
        try {
            boat = await gCloudDatastore.getDoc(req.params.id, BOAT_DATASTORE_KEY);
        } catch (err) {
            return res.status(500).send({'Error': 'failed to search for the boat in the datastore: ' + err});
        }
        if (boat === false) {
            return res.status(404).send({'Error': 'No boat with this boat_id exists'});
        }

        boat = await _getLoads(boat);
        boat = generateSelf(boat, '/boats/' + boat.id);
        return res.status(200).json(boat);
    }

    async getBoats(req, res) {
        let data;
        try {
            data = await gCloudDatastore.getDocsWithPagination(BOAT_DATASTORE_KEY, BOAT_PAGINATION_SIZE, req.query.endCursor);
        } catch (err) {
            return res.status(500).send({'Error': 'failed to search boats in the datastore: ' + err});
        }

        let boats;
        try {
            boats = await Promise.all(data[0].map(async function(boat) {
                boat = await _getLoads(boat);
                return generateSelf(boat, '/boats/' + boat.id);
            }));
        } catch (err) {
            return res.status(500).send({'Error': 'failed to map the loads of the boats: ' + err});
        }

        const pageInfo = data[1];

        let retJSON = {
            "boats": boats
        }

        if (pageInfo.moreResults === true) {
            retJSON.next = ROOT_URL + '/boats?endCursor=' + pageInfo.endCursor;
        }

        return res.status(200).json(retJSON);
    }

    //Deletes the boat with id = req.params.id. Fails if no boat with that id exists.
    //After deleting the boat, updates carrier = null into any loads where the carrier
    //matches the deleted boat id.
    async deleteBoat(req, res) {
        //Try to delete the boat
        let response;
        try {
            response = await gCloudDatastore.deleteDoc(req.params.id, BOAT_DATASTORE_KEY);
        } catch (err) {
            res.status(500).send({'Error': 'failed to delete the boat from the datastore: ' + err});
        }
        if (response === false) {
            return res.status(404).send({'Error': 'No boat with this boat_id exists'});
        }

        //Asynchronously update null carrier into all loads being carried by this boat
        let updatePromises = [];
        let boat = {"id": req.params.id};
        boat = await _getLoads(boat)
        try {
            if (boat.loads) {
                boat.loads.forEach(async (load) => {
                    let oldLoad;
                    try {
                        oldLoad = await gCloudDatastore.getDoc(load.id, LOAD_DATASTORE_KEY);
                    } catch (err) {
                        res.status(500).send({'Error': 'failed to get boat\'s loads from the datastore: ' + err});
                    }

                    const updatedLoad = {
                        "weight": oldLoad.weight,
                        "content": oldLoad.content,
                        "delivery_date": oldLoad.delivery_date,
                        "carrier": null
                    };

                    updatePromises.push(gCloudDatastore.replaceDoc(load.id, updatedLoad, LOAD_DATASTORE_KEY));
                });
            }
            await Promise.all(updatePromises);
        } catch (err) {
            res.status(500).send({'Error': 'failed to update the loads for the delete boat, manual unlinking may be required: ' + err});
        }
        return res.status(204).send();
    }
}

//Adds an array of loads assigned to this boatID to the boat object passed
async function _getLoads(boat) {
    boat.loads = [];
    let loads;
    try {
        loads = await gCloudDatastore.getDocsWithAttribute(LOAD_DATASTORE_KEY, "carrier", "=", boat.id);
    } catch(err) {
        return err;
    }
    loads.forEach((load) => {
        newLoadEntry = {
            "id":load.id,
            "self": generateSelf(ROOT_URL, '/loads/' + load.id)
        }
        boat.loads.push(newLoadEntry);
    });
    return boat;
}

module.exports = { BoatHandlers };