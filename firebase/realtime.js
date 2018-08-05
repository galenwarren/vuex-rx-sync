import firebase from 'firebase/app';
import { Observable, concat, of } from 'rxjs';
import { share, tap } from 'rxjs/operators';
import memoize from 'memoizee';

import { deleteMemoizeRef } from '../utils';

export const observe = memoize((database, path) => {

  const value$ = Observable.create(subscriber => {
    const valueHandler = value => subscriber.next(value.val());
    const errorHandler = error => subscriber.error(error);
    const ref = database.ref(path);
    ref.on('value', valueHandler, errorHandler);
    return () => ref.off();
  });

  return value$.pipe(share());

}, { refCounter: true });

export class FirebaseRealtimeSource {

  constructor(options = {}) {
    const { databaseAccessor } = options;
    this.databaseAccessor = databaseAccessor ||  (() => firebase.database());
  }

  observe(path) {
    const database = this.databaseAccessor();
    return observe(database, path).pipe(deleteMemoizeRef(observe, database, path));
  }

}
