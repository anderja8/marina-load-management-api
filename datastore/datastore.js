const {Datastore} = require('@google-cloud/datastore');
const config = require('../config.js')
const projectId = config.GCLOUD_PROJECT;
const datastore = new Datastore({projectId:projectId});

class GCloudDatastore {
    constructor() {
        this.datastore = datastore;
    }

    //Adds the datastore id to the passed object and then returns the updated object
    fromDatastore(item) {
        console
        item.id = item[Datastore.KEY].id;
        return item;
    }

    //Saves the supplied document to the datastore with the supplied key
    saveDoc(document, datastoreKey) {
        const key = this.datastore.key(datastoreKey);
        return this.datastore.save({"key":key, "data":document}).then(() => {
            document.id = key.id;
            return document;
        });
    }

    //Searches the datastore with the given key for the given id, returns false
    //if no document is found, returns the document othewise.
    getDoc(id, datastoreKey) {
        const key = this.datastore.key([datastoreKey, parseInt(id, 10)]);
        return this.datastore.get(key).then((doc) => {
            if (doc[0] == undefined || doc.length > 1) {
                return false;
            }
            if (doc.length > 1) {
                console.log('Warning: more than one doc found by GCloudDatastore.getDoc');
            }
            return this.fromDatastore(doc[0]);
        });
    }

    //Pulls all documents in the datastore for the given key
    getDocs(datastoreKey){
        const q = this.datastore.createQuery(datastoreKey);
        return this.datastore.runQuery(q).then( (entities) => {
            return entities[0].map(this.fromDatastore);
        });
    }

    //Tries to replace a doc with the given id from the datastore with the given key
    //Returns false if the docID is not in the datastore, or the doc if otherwise
    replaceDoc(docID, newDoc, datastoreKey){
        //Check that the doc exists
        return this.getDoc(docID, datastoreKey).then( (doc) => {
            if (doc === false) {
                return false;
            }
    
            const key = this.datastore.key([datastoreKey, parseInt(id, 10)]);
            return this.datastore.save({"key":key, "data":newDoc}).then(() => {
                newDoc.id = docID;
                return newDoc;
            });
        });
    }

    //Tries to delete a document with the given id from datastore with the given key
    //Returns the key if successful, false if the doc could not be found.
    deleteDoc(id, datastoreKey) {
        //Check that the boat exists
        return this.getDoc(id, datastoreKey).then( (doc) => {
            if (doc === false) {
                return false;
            }
            const key = this.datastore.key([datastoreKey, parseInt(id, 10)]);
            return this.datastore.delete(key);
        });
    }

    //Pulls all documents from the datastore with given key that have an attribute
    //That evaluates to true when the comparator is applied to the attributeValue
    getDocsWithAttribute(datastoreKey, attribute, comparator, attributeValue) {
        const q = this.datastore.createQuery(datastoreKey).filter(attribute, comparator, attributeValue);
        return this.datastore.runQuery(q).then( (entities) => {
            return entities[0].map(this.fromDatastore);
        });
    }
}

module.exports = { GCloudDatastore };