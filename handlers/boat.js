const {GCloudDatastore} = require('../datastore/datastore.js');
gCloudDatastore = new GCloudDatastore();
const { generateSelf } = require('./handlerFunctions.js');

BOAT_DATASTORE_KEY = "boats";

class BoatHandlers {

    postBoat(req, res) {
        //Verify that the required attributes are present
        if (!req.body.name || !req.body.type || !req.body.length) {
            return res.status(400).send({'Error': 'The request object is missing at least one of the required attributes'});
        }

        let new_boat = {
            "name": req.body.name,
            "type": req.body.type,
            "length": req.body.length,
            "loads": []
        };

        gCloudDatastore.saveDoc(new_boat, BOAT_DATASTORE_KEY).then((new_boat) => {
            new_boat = generateSelf(new_boat, '/boats/' + new_boat.id);
            return res.status(201).send(JSON.stringify(new_boat));
        });
    }

    getBoat(req, res) {
        gCloudDatastore.getDoc(req.params.id, BOAT_DATASTORE_KEY).then((boat) => {
            if (boat === false) {
                return res.status(404).send({'Error': 'No boat with this boat_id exists'});
            }
            boat = generateSelf(boat, '/boats/' + boat.id);
            return res.status(200).json(boat);
        })
    }

    getBoats(req, res) {
        gCloudDatastore.getDocsWithPagination(BOAT_DATASTORE_KEY, 3, req.query.endCursor).then((data) => {
            const boats = data[0];
            const pageInfo = data[1];

            let retJSON = {
                "boats": boats,
                "info": {
                    "moreResults": false,
                    "nextPage": null
                }
            }

            if (pageInfo.moreResults === true) {
                retJSON.info.moreResults = true;
                retJSON.info.nextPage = ROOT_URL + '/boats?endCursor=' + pageInfo.endCursor;
            }

            console.log(retJSON);
            return res.status(200).json(retJSON);
        })
    }

    deleteBoat(req, res) {
        gCloudDatastore.deleteDoc(req.params.id, BOAT_DATASTORE_KEY).then((response) => {
            if (response === false) {
                return res.status(404).send({'Error': 'No boat with this boat_id exists'});
            }
            return res.status(204).send();
        })
    }
}

module.exports = { BoatHandlers };