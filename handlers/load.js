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

        newLoad = await gCloudDatastore.saveDoc(newLoad, LOAD_DATASTORE_KEY);
        newLoad = generateSelf(newLoad, '/loads/' + newLoad.id);
        return res.status(201).send(JSON.stringify(newLoad));
    }

    async getLoad(req, res) {
        let load = await gCloudDatastore.getDoc(req.params.id, LOAD_DATASTORE_KEY);
        if (load === false) {
            return res.status(404).send({'Error': 'No load with this load_id exists'});
        }
        if (load.carrier) {
            load = _getCarrier(load);
        }
        load = generateSelf(load, '/loads/' + load.id);
        return res.status(200).json(load);
    }

    async getLoads(req, res) {
        const data = await gCloudDatastore.getDocsWithPagination(LOAD_DATASTORE_KEY, LOAD_PAGINATION_SIZE, req.query.endCursor);
        console.log(data[0]);
        let loads = await Promise.all(data[0].map(async function(load) {
            if (load.carrier) {
                load = await _getCarrier(load);
            }
            return generateSelf(load, '/loads/' + load.id);
        }));
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
        let response = await gCloudDatastore.deleteDoc(req.params.id, LOAD_DATASTORE_KEY);
        if (response === false) {
            return res.status(404).send({'Error': 'No load with this load_id exists'});
        }
        return res.status(204).send();
    }
}

//Adds information on the carrier for the load to the passed load object
async function _getCarrier(load) {
    boat = await gCloudDatastore.getDoc(load.carrier, BOAT_DATASTORE_KEY);
    carrierInfo = {
        "id": boat.id,
        "name": boat.name,
        "self": ROOT_URL + '/boats/' + boat.id
    }
    load.carrier = carrierInfo;
    return load;
}

module.exports = { LoadHandlers };