import { Observable } from "rxjs";

export function onUnsubscribe(action) {
  return source =>
    Observable.create(subscriber => {
      const subscription = source.subscribe(subscriber);
      return () => {
        subscription.unsubscribe();
        action();
      };
    });
}

export const deleteMemoizeRef = (memoized, args) =>
  onUnsubscribe(() => memoized.deleteRef(...args));
