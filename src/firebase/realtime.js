import defaultFirebase from "firebase/app";
import { Observable } from "rxjs";
import { share } from "rxjs/operators";
import memoize from "memoizee";
import { switchMappable } from "../utils";
import { deleteMemoizeRef } from "../transforms";

export const observe = memoize(
  (database, path) => {
    const value$ = Observable.create(subscriber => {
      const valueHandler = value => subscriber.next(value.val());
      const errorHandler = error => subscriber.error(error);
      const ref = database.ref(path);
      ref.on("value", valueHandler, errorHandler);
      return () => ref.off();
    });

    return value$.pipe(share());
  },
  { refCounter: true }
);

export const defaultDatabaseAccessor = firebase => firebase.database();

export class FirebaseRealtimeSource {
  constructor({
    firebase = defaultFirebase,
    database: databaseAccessor = defaultDatabaseAccessor
  }) {
    // const { databaseAccessor = defaultDatabaseAccessor } = options;

    this.observe = switchMappable(path => {
      const database = databaseAccessor(firebase);
      return observe(database, path).pipe(
        deleteMemoizeRef(observe, database, path)
      );
    });
  }
}
