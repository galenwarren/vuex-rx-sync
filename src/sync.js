import { Observable, Subscription, EMPTY, merge } from 'rxjs';
import { map, publish, shareReplay } from 'rxjs/operators';
import memoize from 'memoizee';
import { afterUnsubscribe } from './operators';
import { pathIsValid } from './util';

// the disposers for items cached in the memoized function
const disposers = new Map();

export const syncObservable = config => pathArg => {
  // copy the array to make sure we have an immutable copy
  const path = pathArg.slice();

  // create an observable that we'll merge into the observables to allow
  // for direct completion of the stream during dispose
  let complete = null;
  const complete$ = new Observable(subscriber => {
    complete = () => subscriber.complete();
  }).pipe(publish());
  complete$.connect();

  // create the observable and share with replay, so that any new
  // subscriber always gets the last value. updates are idempotent so this
  // ensures everything stays properly in sync, even if updates come
  // through while the observable is cached with no active subscribers
  const storeValue$ = merge(config.createStoreObservable(path), complete$).pipe(
    shareReplay(1)
  );

  // create connectable observable that sets and/or deletes values in the store
  const sourceValue$ = merge(config.createDataObservable(path), complete$).pipe(
    map(value => config.updateStore(path, value))
  );

  // connect
  const subscription = new Subscription();
  subscription.add(storeValue$.subscribe());
  subscription.add(sourceValue$.subscribe());

  // build the disposer, which consists of the dispose function
  // and also a disposed promise, used to tell when disposal is complete
  const disposer = {};
  disposer.disposed = new Promise((resolve, reject) => {
    disposer.dispose = () => {
      try {
        complete();
        subscription.unsubscribe();
        resolve();
      } catch (err) {
        reject(err);
      }
    };
  });

  // store a disposer for this observable, which unsubscribes, resets the store,
  // and cleans up the disposers map
  disposers.set(storeValue$, disposer);

  // return the store value observable, so consumers see the values
  // that are in the store
  return storeValue$;
};

export const syncObservableRefCounted = config => {
  const { disposeDelay } = config;

  // create the memoized function to create and cache sync observables
  const memoizedSyncObservable = memoize(syncObservable(config), {
    length: 1,
    primitive: true,
    refCounter: true,
    dispose: storeValue$ => {
      const { dispose } = disposers.get(storeValue$);
      dispose();
      disposers.delete(storeValue$);
    },
  });

  // this is the function that returns the sync observable, including wiring
  // up the delayed refcount release mechanism
  const sync = path => {
    if (pathIsValid(path)) {
      return memoizedSyncObservable(path, config).pipe(
        afterUnsubscribe(
          () => memoizedSyncObservable.deleteRef(path),
          disposeDelay
        )
      );
    } else {
      return EMPTY;
    }
  };

  // create a reset function that clears the cache and waits for all observables
  // to be disposed
  const reset = async () => {
    const disposed = Promise.all(
      Array.from(disposers.values()).map(d => d.disposed)
    );
    memoizedSyncObservable.clear();
    await disposed;
  };

  return { sync, reset };
};
