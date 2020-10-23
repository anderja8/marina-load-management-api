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

# Deploy to Google App Engine
