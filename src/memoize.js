import { Observable } from "rxjs";

export function onUnsubscribe(action) {
  return source =>
    Observable.create(subscriber => {
      source.subscribe(subscriber);
      return action();
    });
}

export const deleteMemoizeRef = (memoized, args) =>
  onUnsubscribe(() => memoized.deleteRef(...args));
