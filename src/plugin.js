import { Observable, Subscription, combineLatest, of, EMPTY } from "rxjs";
import { tap, map, publishReplay, pluck, switchMap } from "rxjs/operators";
import memoize from "memoizee";
import objectPath from "object-path";
import log from "picolog";
import { afterUnsubscribe } from "./operators";
import { SET_MUTATION, DELETE_MUTATION, crackStorePath } from "./store";

export const DEFAULT_DISPOSE_DELAY = 3000;

export const DISCONNECT = Symbol();

export const defaultReset = (path, { storeSet }) => storeSet(path, undefined);

export const storeSet = options => (path, value) => {
  log.trace("storeSet", path, value);
  options.store.commit(SET_MUTATION, { path, value });
};

export const storeDelete = options => path => {
  log.trace("storeDelete", path);
  options.store.commit(DELETE_MUTATION, { path });
};

export const syncObservable = options => path => {
  const { dataSource, reset = defaultReset, store } = options;

  // if property doesn't exist, create it so it will be reactive
  const { trunkPath, leafKey } = crackStorePath(path);
  const trunk = objectPath.get(store.state, trunkPath);
  if (!trunk || !trunk.hasOwnProperty(leafKey)) {
    storeSet(options)(path, undefined);
  }

  // the observable for the value in the store we have just ensured exists
  const storeValue$ = Observable.create(subscriber => {
    return store.watch(
      state => objectPath.get(state, path),
      value => subscriber.next(value)
    );
  }).pipe(publishReplay(1));

  // create connectable observable that sets and/or deletes values in the store
  const sourceValue$ = dataSource(path).pipe(
    tap(value => {
      if (value === undefined) {
        storeDelete(path);
      } else {
        storeSet(options)(path, value);
      }
    })
  );

  // connect! kgw combine into one subscription
  const subscription = new Subscription();
  subscription.add(storeValue$.connect());
  subscription.add(sourceValue$.subscribe());

  // attach the disconnect method
  storeValue$[DISCONNECT] = () => {
    subscription.unsubscribe();

    const value = objectPath.get(store.state, path);
    if (value !== undefined) {
      reset(path, {
        value,
        storeSet: storeSet(options),
        storeDelete: storeDelete(options)
      });
    }
  };

  return storeValue$;
};

export const pathIsValid = path => {
  return !path.includes(undefined) && !path.includes(null);
};

export const syncObservableRefCounted = options => {
  const { disposeDelay = DEFAULT_DISPOSE_DELAY } = options;

  const memoized = memoize(syncObservable(options), {
    length: 1,
    primitive: true,
    refCounter: true,
    dispose: storeValue$ => storeValue$[DISCONNECT]()
  });

  return path => {
    if (pathIsValid(path)) {
      return memoized(path, options).pipe(
        afterUnsubscribe(() => memoized.deleteRef(path), disposeDelay)
      );
    } else {
      return EMPTY;
    }
  };
};

export const watch = vm => target => {
  return vm
    .$watchAsObservable(target, { immediate: true })
    .pipe(pluck("newValue"));
};

export const resolve = (value$, getKeys, getObservable, keyName = "id") => {
  return value$.pipe(
    switchMap(value => {
      const keys = getKeys(value);
      if (keys && keys.length) {
        return combineLatest(
          keys.map(key =>
            getObservable(key).pipe(
              map(value => {
                const valueWithKey = { ...value };
                valueWithKey[keyName] = key;
                return valueWithKey;
              })
            )
          )
        );
      } else {
        return of([]);
      }
    })
  );
};

export const rxSync = options =>
  function() {
    const sync = syncObservableRefCounted(options);
    return { sync, watch: watch(this), resolve };
  };

export const getObservable = function(name) {
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

export const VueRxSync = {
  install(Vue, options) {
    Vue.prototype.$rxSync = rxSync(options);
    Vue.prototype.$getObservable = getObservable;
  }
};
