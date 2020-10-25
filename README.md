# Usage
This project requires a file in the root directory called config.json that has the format:
```
{
    "GCLOUD_PROJECT": "<your project name>",
    "DATA_BACKEND": "datastore"
}
```

# Running locally
First, you need to be running the gcloud datastore emulator. Instructions for setting that up
can be found [here](https://cloud.google.com/datastore/docs/tools/datastore-emulator). I prefer `gcloud beta emulators datastore start --no-store-on-disk`.

Then, in a separate terminal, run `$(gcloud beta emulators datastore env-init)` and
`npm start server.js`

# Deploying to Google App Engine
Simply run `gcloud app deploy --project <your GAE project ID>` to deploy this app to the google app engine. My version is running at:
https://anderja8-marina-load-manager.appspot.com. Alternatively, you can set the default project with `gcloud config set project <your GAE project ID>`
and then run `gcloud app deploy`.