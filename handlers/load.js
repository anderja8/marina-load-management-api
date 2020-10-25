const {GCloudDatastore} = require('../datastore/datastore.js');
gCloudDatastore = new GCloudDatastore();
const { generateSelf } = require('./handlerFunctions.js');
const moment = require('moment');

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

        newLoad = await gCloudDatastore.saveDoc(newLoad, LOAD_DATASTORE_KEY);
        newLoad = generateSelf(newLoad, '/loads/' + newLoad.id);
        return res.status(201).send(JSON.stringify(newLoad));
    }

    async getLoad(req, res) {
        let load = gCloudDatastore.getDoc(req.params.id, LOAD_DATASTORE_KEY);
        if (load === false) {
            return res.status(404).send({'Error': 'No load with this load_id exists'});
        }
        load = generateSelf(load, '/loads/' + load.id);
        return res.status(200).json(load);
    }

    async getLoads(req, res) {
        data = await gCloudDatastore.getDocsWithPagination(LOAD_DATASTORE_KEY, LOAD_PAGINATION_SIZE, req.query.endCursor);
        let loads = data[0];
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
        let load = await gCloudDatastore.getDoc(req.params.id, LOAD_DATASTORE_KEY);
        if (load === false) {
            return res.status(404).send({'Error': 'No load with this load_id exists'});
        }

        if (load.carrier !== null) {
            let boat = await gCloudDatastore.getDoc(req.params.id, BOAT_DATASTORE_KEY);
            loadIndex = boat.loads.indexOf(req.params.id);
            if (loadIndex >= 0) {
                boat.loads.splice(loadIndex, 1);
            }
            let updatedBoat = {
                "name": boat.name,
                "type": boat.type,
                "length": boat.length,
                "loads": boat.loads
            };
            await gCloudDatastore.replaceDoc(boat.id, updatedBoat, BOAT_DATASTORE_KEY);
        }

        let response = await gCloudDatastore.deleteDoc(req.params.id, LOAD_DATASTORE_KEY);
        if (response === false) {
            return res.status(404).send({'Error': 'No load with this load_id exists'});
        }
        return res.status(204).send();
    }
}

module.exports = { LoadHandlers };