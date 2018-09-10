import { Observable, of, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export function afterUnsubscribe(action, delay) {
  return source =>
    Observable.create(subscriber => {
      const subscription = source.subscribe(subscriber);
      return () => {
        setTimeout(() => {
          subscription.unsubscribe();
          action();
        }, delay);
      };
    });
}

export function addAttribute(key, attributeValue) {
  return source =>
    Observable.create(subscriber => {
      return source
        .pipe(
          map(
            value =>
              value
                ? Object.assign({}, value, { [key]: attributeValue })
                : value
          )
        )
        .subscribe(subscriber);
    });
}

export function resolve(getKeys, getObservable) {
  return source => {
    return Observable.create(subscriber => {
      return source
        .pipe(
          switchMap(value => {
            const keys = getKeys(value);
            if (keys && keys.length) {
              return combineLatest(keys.map(getObservable));
            } else {
              return of([]);
            }
          })
        )
        .subscribe(subscriber);
    });
  };
}
