import { Subscription, EMPTY } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import memoize from 'memoizee';
import { afterUnsubscribe } from './operators';
import { pathIsValid } from './util';

const disposers = new WeakMap();

export const syncObservable = config => path => {
  // create the observable and share with replay, so that any new
  // subscriber always gets the last value. updates are idempotent so this
  // ensures everything stays properly in sync, even if updates come
  // through while the observable is cached with no active subscribers
  const storeValue$ = config.createStoreObservable(path).pipe(shareReplay(1));

  // create connectable observable that sets and/or deletes values in the store
  const sourceValue$ = config
    .createDataObservable(path)
    .pipe(map(value => config.updateStore(path, value)));

  // connect
  const subscription = new Subscription();
  subscription.add(storeValue$.subscribe());
  subscription.add(sourceValue$.subscribe());

  // store a disposer for this observable
  disposers.set(storeValue$, () => {
    subscription.unsubscribe();
    config.resetStore(path);
  });

  // return the store value observable, so consumers see the values
  // that are in the store
  return storeValue$;
};

export const syncObservableRefCounted = config => {
  const { disposeDelay } = config;

  const memoized = memoize(syncObservable(config), {
    length: 1,
    primitive: true,
    refCounter: true,
    dispose: storeValue$ => disposers.get(storeValue$)(),
  });

  return path => {
    if (pathIsValid(path)) {
      return memoized(path, config).pipe(
        afterUnsubscribe(() => memoized.deleteRef(path), disposeDelay)
      );
    } else {
      return EMPTY;
    }
  };
};
