import { Observable } from "rxjs";
import memoize from "memoizee";
import { switchMappable } from "./utils";
import { deleteMemoizeRef } from "./transform";
import { SET_MUTATION, DELETE_MUTATION } from "./store";

export const defaultResetAction = ({ path, storeSet }) =>
  storeSet(path, undefined);

export function syncStoreObservable(options) {
  const {
    observable: observableFactory,
    store,
    sources,
    resetAction = defaultResetAction
  } = options;

  // a couple store related helpers
  const storeSet = (path, value) => store.commit(SET_MUTATION, { path, value });
  const storeDelete = path => store.commit(DELETE_MUTATION, { path });

  // keyed by the transform factory for the path
  const updateStorePaths = new Map();

  const updateStore = memoize(
    path => {
      const transform = value$ => {
        return Observable.create(subscriber =>
          value$.subscribe(value => {
            storeSet(path, value);
            subscriber.next(value);
          })
        ).pipe(deleteMemoizeRef(updateStore, path));
      };

      updateStorePaths.set(transform, path);
      return transform;
    },
    {
      refCounter: true,
      dispose(transform) {
        const path = updateStorePaths.get(transform);
        resetAction({ path, storeSet, storeDelete });
        updateStorePaths.delete(transform);
      }
    }
  );

  const sync = (source, sourceLocation, path) => {
    return source(sourceLocation).pipe(updateStore(path));
  };

  return observableFactory({
    sync: switchMappable(sync),
    updateStore,
    sources
  });
}
