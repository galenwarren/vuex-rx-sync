import Vue from 'vue';
import { Observable, Subscription, combineLatest, of, EMPTY } from "rxjs";
import { tap, map, publish, publishReplay, pluck, switchMap } from "rxjs/operators";
import memoize from 'memoizee';
import objectPath from 'object-path';
import { afterUnsubscribe } from './operators';
import { SET_MUTATION, DELETE_MUTATION, crackStorePath } from './store';

export const DISCONNECT = Symbol();

export const defaultReset = (path, { storeSet }) => storeSet(path, undefined);

export const memoizedSync = memoize((path, options) => {

  const { dataSource, reset, store, storeSet, storeDelete } = options;

  // if property doesn't exist, create it so it will be reactive
  const { trunkPath, leafKey } = crackStorePath(path);
  const trunk = objectPath.get(store.state, trunkPath);
  if (!trunk || !trunk.hasOwnProperty(leafKey)) {
    storeSet(path, undefined);
  }

  // the observable for the value in the store we have just ensured exists
  const storeValue$ = Observable.create(subscriber => {
    return store.watch(
      state => objectPath.get(state, path),
      value => subscriber.next(value),
    );
  }).pipe(publishReplay(1));

  // create connectable observable that sets and/or deletes values in the store
  const sourceValue$ = options.dataSource(path).pipe(
    tap(value => {
      if (value === undefined) {
        storeDelete(path);
      } else {
        storeSet(path, value);
      }
    }),
  );

  // connect! kgw combine into one subscription
  const subscription = new Subscription();
  subscription.add(storeValue$.connect());
  subscription.add(sourceValue$.subscribe());

  // create the disconnect method
  storeValue$[DISCONNECT] = () => {
    subscription.unsubscribe();

    const value = objectPath.get(store.state, path);
    if (value !== undefined) {
      reset(path, { value, storeSet, storeDelete });
    }
  };

  return storeValue$;

}, {
  length: 1,
  primitive: true,
  refCounter: true,
  dispose: storeValue$ => storeValue$[DISCONNECT](),
});

export const pathIsValid = path => {
  return !path.includes(undefined) && !path.includes(null);
}

export const VueRxSync = {

  install(Vue, options) {

    const { store, dataSource, reset = defaultReset, disposeDelay = 3000 } = options;

    const storeSet = (path, value) => {
      console.log('storeSet', path, value);
      store.commit(SET_MUTATION, { path, value });
    }

    const storeDelete = (path) => {
      console.log('storeDelete', path);
      store.commit(DELETE_MUTATION, { path });
    }

    Vue.prototype.$rxSync = function() {
      return {

        sync: path => {
          if (pathIsValid(path)) {
            return memoizedSync(path, { dataSource, reset, store, storeSet, storeDelete }).pipe(
              afterUnsubscribe(() => memoizedSync.deleteRef(path), disposeDelay),
            );
          } else {
            return EMPTY;
          }
        },

        watch: target => {
          return this.$watchAsObservable(target, { immediate: true }).pipe(
            pluck('newValue')
          );
        },

        reference: (value$, getKeys, getObservable, keyName='id') => {
          return value$.pipe(switchMap(value => {
            const keys = getKeys(value);
            if (keys && keys.length) {
              return combineLatest(keys.map(key => getObservable(key).pipe(map(value => ({ [keyName]: key, ...value })))));
            } else {
              return of([]);
            }
          }));
        },

      };

    };

    Vue.prototype.$getObservable = function(name) {
      if (this.$observables) {
        const observable = this.$observables[name];
        if (observable) {
          return observable;
        }
      }
      if (this.$parent) {
        return this.$parent.$getObservable(name);
      }
      return null;
    };

  },
};
