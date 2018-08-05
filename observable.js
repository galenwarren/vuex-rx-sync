import Vue from 'vue';
import { Observable, concat, of, fromEventPattern } from 'rxjs';
import { SET_MUTATION, DELETE_MUTATION } from './store';
import { onUnsubscribe, deleteMemoizeRef } from './utils';
import memoize from 'memoizee';

const defaultResetAction = ({ path, setState }) => setState(path, undefined);

export function syncStoreObservable(options) {

  const {
    observable: factory,
    store,
    sources,
    resetAction = defaultResetAction,
  } = options;

  const watch = (accessor) => {

    const vm = new Vue({
      computed: {
        value() { return accessor(); }
      },
    })

    return concat(
      of(accessor()),
      fromEventPattern(
        handler => vm.$watch('value', handler),
        (handler, unsubscribe) => unsubscribe(),
      ),
    );
  }

  const setState = (path, value) => {
    store.commit(SET_MUTATION, { path, value });
  }

  const deleteState = (path) => {
    store.commit(DELETE_MUTATION, { path });
  }

  // keyed by the transform factory for the path
  const updateStatePaths = new WeakMap();

  const updateState = memoize(path => {

    const transform = value$ => {
      return Observable.create(subscriber => value$.subscribe(value => {
        setState(path, value);
        subscriber.next(value);
      })).pipe(deleteMemoizeRef(updateState, path));
    };

    updateStatePaths.set(transform, path);
    return transform;

  }, {
    refCounter: true,
    dispose(transform) {
      const path = updateStatePaths.get(transform);
      resetAction({ path, setState, deleteState });
    },
  });

  const sync = (source, sourceLocation, path) => {
    return source.observe(sourceLocation).pipe(updateState(path));
  };

  return factory({ watch, updateState, sync, sources });

}
