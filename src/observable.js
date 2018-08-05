import Vue from "vue";
import { Observable, concat, of, fromEventPattern } from "rxjs";
import memoize from "memoizee";
import { deleteMemoizeRef } from "./memoize";

const defaultResetAction = ({ path, setState }) => setState(path, undefined);

export function syncStoreObservable(options) {
  const {
    observable: factory,
    store,
    sources,
    resetAction = defaultResetAction
  } = options;

  const watch = accessor => {
    const vm = new Vue({
      computed: {
        value() {
          return accessor();
        }
      }
    });

    return concat(
      of(accessor()),
      fromEventPattern(
        handler => vm.$watch("value", handler),
        (handler, unsubscribe) => unsubscribe()
      )
    );
  };

  const storeSet = (path, value) => store.set(path, value);

  const storeDelete = path => store.delete(path);

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
    return source.observe(sourceLocation).pipe(updateStore(path));
  };

  return factory({ watch, updateStore, sync, sources });
}
