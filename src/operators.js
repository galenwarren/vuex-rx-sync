import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
