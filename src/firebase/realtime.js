import firebase from "firebase/app";
import { Observable } from "rxjs";

// in this database, a null value means the value doesn't exist, so translate
// to undefined for the purposes of this library
export function transformValue(value) {
  return value === null ? undefined : value;
}

export function firebaseRealtimeSource(path) {
  return Observable.create(subscriber => {
    const valueHandler = value => subscriber.next(transformValue(value.val()));
    const errorHandler = error => subscriber.error(error);

    const database = firebase.database();
    const ref = database.ref(path);

    console.log("firebaseRealtime:on", path);
    ref.on("value", valueHandler, errorHandler);

    return () => {
      console.log("firebaseRealtime:off", path);
      ref.off();
    };
  });
}
