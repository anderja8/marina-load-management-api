const {GCloudDatastore} = require('../datastore/Datastore.js');
gCloudDatastore = new GCloudDatastore();

class BoatHandlers {
    constructor() {
        this.DATASTORE_KEY = "boats";
        this.ROOT_URL = 'anderja8-marina-load-manager.appspot.com';
    }

    generateSelf(item, suffix) {
        item.self = this.ROOT_URL + suffix;
        return item;
    }

    postBoat(req, res) {
        //Verify that the required attributes are present
        if (!req.body.name || !req.body.type || !req.body.length) {
            return res.status(400).send({'Error': 'The request object is missing at least one of the required attributes'});
        }

        new_boat = {
            "name": req.body.name,
            "type": req.body.type,
            "length": req.body.length
        };

        gCloudDatastore.saveDoc(new_boat, this.DATASTORE_KEY).then((new_boat) => {
            new_boat = this.generateSelf(new_boat, '/boats/' + this.id);
            return res.status(201).send(JSON.stringify(new_boat));
        });
    }

    getBoat(req, res) {
        gCloudDatastore.getDoc(req.params.id, this.DATASTORE_KEY).then((boat) => {
            if (boat === false) {
                return res.status(404).send({'Error': 'No boat with this boat_id exists'});
            }
            boat = this.generateSelf(new_boat, '/boats/' + this.id);
            return res.status(200).json(boat);
        })
    }

    getBoats(req, res) {
        gCloudDatastore.getDocs(this.DATASTORE_KEY).then((boats) => {
            boats = boats.map(
                function(boat) { return this.generateSelf(boat, '/boats/' + this.id); }
            );
            return res.status(200).json(boats);
        })
    }

    deleteBoat(req, res) {
        gCloudDatastore.deleteDoc(req.params.id, this.DATASTORE_KEY).then((response) => {
            if (response === false) {
                return res.status(404).send({'Error': 'No boat with this boat_id exists'});
            }
            return res.status(204).send();
        })
    }
}

module.exports = { BoatHandlers };