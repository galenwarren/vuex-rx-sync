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
