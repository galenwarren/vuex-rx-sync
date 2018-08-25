import { Observable } from 'rxjs';

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
      return source.subscribe(
        value =>
          subscriber.next(Object.assign({}, value, { [key]: attributeValue })),
        error => subscriber.error(error),
        () => subscriber.complete()
      );
    });
}
