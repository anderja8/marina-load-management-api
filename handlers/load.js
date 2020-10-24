const {GCloudDatastore} = require('../datastore/datastore.js');
gCloudDatastore = new GCloudDatastore();
const { generateSelf } = require('./handlerFunctions.js');
const moment = require('moment');
const boat = require('./boat.js');
const { BoatHandlers } = require('./boat.js');

LOAD_DATASTORE_KEY = "loads";

class LoadHandlers {

    postLoad(req, res) {
        //Verify that the required attributes are present
        if (!req.body.weight || !req.body.content || !req.body.delivery_date) {
            return res.status(400).send({'Error': 'The request object is missing at least one of the required attributes'});
        }

        //Verify delivery_date formatting
        if (!moment(req.body.delivery_date, 'MM/DD/YYYY', true).isValid()) {
            return res.status(400).send({'Error': 'the request object delivery_date could not map to a valid date. Format must be MM/DD/YYYY'});
        }

        let new_load = {
            "weight": req.body.weight,
            "content": req.body.content,
            "delivery_date": req.body.delivery_date,
            "carrier": null
        };

        gCloudDatastore.saveDoc(new_load, LOAD_DATASTORE_KEY).then((new_load) => {
            new_load = generateSelf(new_load, '/loads/' + new_load.id);
            return res.status(201).send(JSON.stringify(new_load));
        });
    }

    getLoad(req, res) {
        gCloudDatastore.getDoc(req.params.id, LOAD_DATASTORE_KEY).then((load) => {
            if (load === false) {
                return res.status(404).send({'Error': 'No load with this load_id exists'});
            }
            load = generateSelf(load, '/loads/' + load.id);
            return res.status(200).json(load);
        })
    }

    getLoads(req, res) {
        gCloudDatastore.getDocsWithPagination(LOAD_DATASTORE_KEY, 3, req.query.endCursor).then((data) => {
            let loads = data[0];
            const pageInfo = data[1];
            
            let retJSON = {
                "loads": loads
            }

            if (pageInfo.moreResults === true) {
                retJSON.next = ROOT_URL + '/loads?endCursor=' + pageInfo.endCursor;
            }
            
            return res.status(200).json(retJSON);
        })
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