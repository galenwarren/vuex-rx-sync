import { Observable } from 'rxjs';
import { onUnsubscribe } from './observable';

export const deleteMemoizeRef = (memoized, args) =>
  onUnsubscribe(() => memoized.deleteRef(...args));

/*
export function deleteMemoizeRef(memoized, ...args) {
  return source => Observable.create(subscriber => {
    source.subscribe(subscriber);
    return () => memoized.deleteRef(...args);
  });
};
*/
