const {GCloudDatastore} = require('../datastore/datastore.js');
gCloudDatastore = new GCloudDatastore();
const { generateSelf } = require('./handlerFunctions.js');
const moment = require('moment');
const boat = require('./boat.js');

class LoadHandlers {

    async postLoad(req, res) {
        //Verify that the required attributes are present
        if (!req.body.weight || !req.body.content || !req.body.delivery_date) {
            return res.status(400).send({'Error': 'The request object is missing at least one of the required attributes'});
        }

        //Verify delivery_date formatting
        if (!moment(req.body.delivery_date, 'MM/DD/YYYY', true).isValid()) {
            return res.status(400).send({'Error': 'the request object delivery_date could not map to a valid date. Format must be MM/DD/YYYY'});
        }

        let newLoad = {
            "weight": req.body.weight,
            "content": req.body.content,
            "delivery_date": req.body.delivery_date,
            "carrier": null
        };

        let savedLoad;
        try { 
            savedLoad = await gCloudDatastore.saveDoc(newLoad, LOAD_DATASTORE_KEY);
        } catch (err) {
            res.status(500).send({'Error': 'failed to save the load to the datastore: ' + err});
        }
        savedLoad = generateSelf(savedLoad, '/loads/' + savedLoad.id);
        return res.status(201).send(JSON.stringify(savedLoad));
    }

    async getLoad(req, res) {
        let load;
        try {
            load = await gCloudDatastore.getDoc(req.params.id, LOAD_DATASTORE_KEY);
        } catch (err) {
            res.status(500).send({'Error': 'failed to retrieve the load from the datastore: ' + err});
        }
        if (load === false) {
            return res.status(404).send({'Error': 'No load with this load_id exists'});
        }
        if (load.carrier) {
            load = await _getCarrier(load);
        }
        load = generateSelf(load, '/loads/' + load.id);
        return res.status(200).json(load);
    }

    async getLoads(req, res) {
        let data;
        try {
            data = await gCloudDatastore.getDocsWithPagination(LOAD_DATASTORE_KEY, LOAD_PAGINATION_SIZE, req.query.endCursor);
        } catch (err) {
            res.status(500).send({'Error': 'failed to retrieve loads from the datastore: ' + err});
        }

        let loads;
        try {
            loads = await Promise.all(data[0].map(async function(load) {
                if (load.carrier) {
                    load = await _getCarrier(load);
                }
                return generateSelf(load, '/loads/' + load.id);
            }));
        } catch (err) {
            res.status(500).send({'Error': 'failed to map carriers for the loads: ' + err});
        }
        const pageInfo = data[1];
        
        let retJSON = {
            "loads": loads
        }

        if (pageInfo.moreResults === true) {
            retJSON.next = ROOT_URL + '/loads?endCursor=' + pageInfo.endCursor;
        }
        
        return res.status(200).json(retJSON);
    }

    async deleteLoad(req, res) {
        let response;
        try {
            response = await gCloudDatastore.deleteDoc(req.params.id, LOAD_DATASTORE_KEY);
        } catch (err) {
            res.status(500).send({'Error': 'failed to delete load from the datastore: ' + err});
        }
        if (response === false) {
            return res.status(404).send({'Error': 'No load with this load_id exists'});
        }
        return res.status(204).send();
    }

    async linkLoad(req, res) {
        let docs;
        try {
            docs = await Promise.all([
                gCloudDatastore.getDoc(req.params.load_id, LOAD_DATASTORE_KEY),
                gCloudDatastore.getDoc(req.params.boat_id, BOAT_DATASTORE_KEY)
            ]);
        } catch (err) {
            res.status(500).send({'Error': 'failed to retrieve docs from the datastore: ' + err});
        }
        const load = docs[0];
        const boat = docs[1];

        if (load === false || boat === false) {
            return res.status(404).send({'Error': 'The specified boat and/or load does not exist'});
        } else if (load.carrier) {
            return res.status(403).send({'Error': 'The load is already assigned to boat with id: ' + load.carrier});
        }

        const updatedLoad = {
            "weight": load.weight,
            "content": load.content,
            "delivery_date": load.delivery_date,
            "carrier": req.params.boat_id
        };

        try {
            await gCloudDatastore.replaceDoc(req.params.load_id, updatedLoad, LOAD_DATASTORE_KEY);
        } catch (err) {
            res.status(500).send({'Error': 'failed to update load in loads datastore: ' + err});
        }
        return res.status(204).send();
    }

    async unlinkLoad(req, res) {
        let docs;
        try {
            docs = await Promise.all([
                gCloudDatastore.getDoc(req.params.load_id, LOAD_DATASTORE_KEY),
                gCloudDatastore.getDoc(req.params.boat_id, BOAT_DATASTORE_KEY)
            ]);
        } catch (err) {
            res.status(500).send({'Error': 'failed to retrieve docs from the datastore: ' + err});
        }
        const load = docs[0];
        const boat = docs[1];

        if (load === false || boat === false || load.carrier !== req.params.boat_id) {
            return res.status(404).send({'Error': 'No load with this load_id is assigned to a boat with this boat_id'});
        }

        const updatedLoad = {
            "weight": load.weight,
            "content": load.content,
            "delivery_date": load.delivery_date,
            "carrier": null
        };

        try {
            await gCloudDatastore.replaceDoc(req.params.load_id, updatedLoad, LOAD_DATASTORE_KEY);
        } catch (err) {
            res.status(500).send({'Error': 'failed to update load in loads datastore: ' + err});
        }
        return res.status(204).send();
    }
}

//Adds information on the carrier for the load to the passed load object
async function _getCarrier(load) {
    let boat;
    try {
        boat = await gCloudDatastore.getDoc(load.carrier, BOAT_DATASTORE_KEY);
    } catch (err) {
        return err;
    }
    carrierInfo = {
        "id": boat.id,
        "name": boat.name,
        "self": ROOT_URL + '/boats/' + boat.id
    }
    load.carrier = carrierInfo;
    return load;
}

module.exports = { LoadHandlers };