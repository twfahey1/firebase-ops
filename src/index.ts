import * as core from '@actions/core';
import * as admin from 'firebase-admin';

let firebase: admin.app.App;

const isDebug: boolean = core.isDebug();
const isRequired = {
  required: true,
};

const initFirebase = () => {
  try {
    core.info("Initialized Firebase Admin Connection");
    const credentials = core.getInput('credentials', isRequired);
    const op = core.getInput('operation', isRequired);
    core.info(`Found operation: ${op}`);
    if (op == "read") {
      core.info(`Confirm that op == "read": ${op}`);

    }
    firebase = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(credentials) as admin.ServiceAccount),
      databaseURL: core.getInput('databaseUrl')
    });
  } catch(error) {
    core.setFailed(JSON.stringify(error));
    process.exit(core.ExitCode.Failure);
  }
}

const getDatabaseType = () => {
  let type = core.getInput('databaseType');

  type = !type ? 'realtime' : type;

  if (type !== 'realtime' && type !== 'firestore') {
    core.setFailed('Database type invalid, please set to either realtime or firestore');
    process.exit(core.ExitCode.Failure);
  }

  return type;
}

const getValue = () => {
  core.info("Trying to parse expected value");
  const value = core.getInput('value');

  if (!value) {
    return Date.now();
  }

  try {
    return JSON.parse(value);
  } catch {
    const num = Number(value);

    if (isNaN(num)) {
      return value;
    }

    return num;
  }
}

const updateRealtimeDatabase = async (path: string, value: any) => {
  core.info(`Updating Realtime Database at ${path}`);

  await firebase.database()
    .ref(path)
    .set(value,
      error => {
        if (error instanceof Error) {
          core.setFailed(JSON.stringify(error));
          process.exit(core.ExitCode.Failure);
        }

        process.exit(core.ExitCode.Success);
      }
    );
}

const deleteValFromRealtimeDatabase = async (path: string) => {
  core.info(`Deleting from Realtime Database at ${path}`);

  await firebase.database()
    .ref(path)
    .set(null,
      error => {
        if (error instanceof Error) {
          core.setFailed(JSON.stringify(error));
          process.exit(core.ExitCode.Failure);
        }

        process.exit(core.ExitCode.Success);
      }
    );
}

const getRealtimeDatabaseValue = async (path: string) => {
  core.info(`Reading Realtime Database at ${path}`);

  await firebase.database()
  .ref(path)
  .on('value', (snapshot) => {
    const valueOfRead = snapshot.val();
    console.log(valueOfRead ?? "no value found");
    core.setOutput("retrievedValue", JSON.stringify(valueOfRead));
    process.exit(core.ExitCode.Success);

  }, (error: any) => {
    console.log('The read failed: ' + error.name);
    core.setFailed(JSON.stringify(error));
    process.exit(core.ExitCode.Failure);
  }); 

}

const updateFirestoreDatabase = (path: string, value: Record<string, any>) => {
  const document = core.getInput('doc', isRequired);

  core.info(`Updating Firestore Database at collection: ${path} document: ${document}`)
  firebase.firestore()
    .collection(path)
    .doc(document)
    .set(value)
    .then(
      () => {
        process.exit(core.ExitCode.Success);
      },
      (reason) => {
        core.setFailed(JSON.stringify(reason));
        process.exit(core.ExitCode.Failure);
      }
    );
}

const processAction = () => {
  initFirebase();
  const databaseType = getDatabaseType();
  const path: string = core.getInput('path', isRequired);
  const op: string = core.getInput('operation', isRequired);
  core.info(`Found operation: ${op}`);
  core.info(`So going to do operation: ${op}`);

  if (op == "read") {
      try {
        if (databaseType === 'realtime') {
          getRealtimeDatabaseValue(path);
        }
      } 
      catch(error) {
        core.setFailed(JSON.stringify(error));
        process.exit(core.ExitCode.Failure);
      }
  }
  if (op == "write") {
    try {
        const value = getValue();

        if (databaseType === 'realtime') {
          updateRealtimeDatabase(path, value);
        }
    
        if (databaseType === 'firestore') {
          updateFirestoreDatabase(path, value);
        }
      } 
    catch(error) {
        core.setFailed(JSON.stringify(error));
        process.exit(core.ExitCode.Failure);
      }
  }
  if (op == "delete") {
    try {
      if (databaseType === 'realtime') {
        deleteValFromRealtimeDatabase(path);
      }
    } 
  catch(error) {
      core.setFailed(JSON.stringify(error));
      process.exit(core.ExitCode.Failure);
    }
    
  }
}

processAction();
