import { Observable } from 'rxjs';
import { EMPTY, of } from 'rxjs';

export function observeKeys(obj) {
  return obj ? of(...Object.keys(obj)) : EMPTY;
}

export function onUnsubscribe(action) {
  return source => Observable.create(subscriber => {
    source.subscribe(subscriber);
    return action();
  });
}
