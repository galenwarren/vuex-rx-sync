import { Observable, Subscription, combineLatest, of, EMPTY } from "rxjs";
import { tap, map, publishReplay, pluck, switchMap } from "rxjs/operators";
import memoize from "memoizee";
import objectPath from "object-path";
import log from "picolog";
import { afterUnsubscribe } from "./operators";
import { SET_MUTATION, DELETE_MUTATION, crackStorePath, storeSet, storeDelete } from "./store";

export const DEFAULT_DISPOSE_DELAY = 3000;

const disposers = new WeakMap();

export const defaultReset = (path, { storeSet }) => storeSet(path, undefined);

export const syncObservable = options => path => {
  const { dataSource, store, reset = defaultReset } = options;

  // if property doesn't exist, create it so it will be reactive
  const { trunkPath, leafKey } = crackStorePath(path);
  const trunk = objectPath.get(store.state, trunkPath);
  if (!trunk || !trunk.hasOwnProperty(leafKey)) {
    storeSet(store)(path, undefined);
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
        storeDelete(store)(path);
      } else {
        storeSet(store)(path, value);
      }
    })
  );

  // connect!
  const subscription = new Subscription();
  subscription.add(storeValue$.connect());
  subscription.add(sourceValue$.subscribe());

  // store a disposer for this observable
  disposers.set(storeValue$, () => {
    subscription.unsubscribe();

    const value = objectPath.get(store.state, path);
    if (value !== undefined) {
      reset(path, {
        value,
        storeSet: storeSet(store),
        storeDelete: storeDelete(store),
      });
    }
  });

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
    dispose: storeValue$ => disposers.get(storeValue$)()
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
