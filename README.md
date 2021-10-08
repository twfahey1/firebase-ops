# Firebase Operations

This action allows you to: 
- Set values into your firebase database (`realtime` or `firestore`) from and based on your current build.
- Retrieve a value from realtime DB and set as output for subsequent step logic.

Build inspired by https://github.com/w9jds/firebase-trigger.git

## Inputs

* `credentials` - **Required** This action uses firebase admin, so you need to provide a service account json object for proper authentication.
* `databaseUrl` - **Required** Database Url you are trying to connect to. It is usually something like: `https://[project_id].firebaseio.com`
* `databaseType` - **Optional** The database you want to connect to. Defaults to `realtime`, Accepts `realtime` and `firestore`.
* `path` - **Required** Path to the field you want to modify. If you are using firestore, this is the collection path.
* `doc` - **Required for Firestore** Document you want to modify. Uses set, so it will write/overwrite the whole file.
* `value` - **Optional** Value you would like to set. Defaults to `Date.now()` timestamp. If you are using Firestore this MUST be a JSON Object.
* `operation` - "read"

## Usage

For "write" operation: Writes to a realtime database, and sets the lastRelease to a `Date.now()` timestamp.

```yaml
notify:
  runs-on: ubuntu-latest
  name: Nofity
  needs: [build, deploy]
  steps:
    - name: Update latest version in realtime database
      uses: w9jds/firebase-trigger@master
      with:
        credentials: ${{ secrets.FIREBASE_CREDENTIALS }}
        databaseUrl: https://[project_id].firebaseio.com
        path: version/lastRelease
        operation: read | write
        value: "some data from other step"
```

For "read" operation: Retrieves value and sets output as `retrievedValue` which can be used in subsequent steps - e.g. `${{ steps.whatever-step-id.outputs.retrievedValue }}`. The output is a JSON string.

### Recommendation

You should store the Service Account JSON into a secret on your repo. Also, this can be very powerful if you start passing outputs from other jobs into this one to write values.


### Development
- Use > node 14
- `npm install`, make any changes to `src/index.ts`
- Build with `npm run build && npm run pack`, commit and push all resulting files
