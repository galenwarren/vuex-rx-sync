import defaultFirebase from "firebase/app";
import { Observable } from "rxjs";
import { sourceFactory } from "../source";

export const defaultDatabaseAccessor = firebase => firebase.database();

export default sourceFactory({
  enrichArgs(options) {
    const {
      firebase = defaultFirebase,
      databaseAccessor = defaultDatabaseAccessor
    } = options;

    return path => [databaseAccessor(firebase), path];
  },

  createObservable(database, path) {
    return Observable.create(subscriber => {
      const valueHandler = value => subscriber.next(value.val());
      const errorHandler = error => subscriber.error(error);
      const ref = database.ref(path);
      ref.on("value", valueHandler, errorHandler);
      return () => ref.off();
    });
  }
});
