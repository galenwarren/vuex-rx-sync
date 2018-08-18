import { combineLatest } from "rxjs";
import { pluck, switchMap, map } from "rxjs/operators";
import log from "picolog";
import { syncObservableRefCounted } from './sync';

export const watch = vm => target => {
  return vm
    .$watchAsObservable(target, { immediate: true })
    .pipe(pluck("newValue"));
};

export const resolve = (value$, getKeys, getObservable, keyName = "id") => {
  return value$.pipe(
    switchMap(value => {
      const keys = getKeys(value);
      if (keys && keys.length) {
        return combineLatest(
          keys.map(key =>
            getObservable(key).pipe(
              map(value => {
                const valueWithKey = { ...value };
                valueWithKey[keyName] = key;
                return valueWithKey;
              })
            )
          )
        );
      } else {
        return of([]);
      }
    })
  );
};

export const rxSync = options => {
  const sync = syncObservableRefCounted(options);
  return function() {
    return { sync, resolve, watch: watch(this) };
  };
}

export const getObservable = function(name) {
  if (this.$observables) {
    const observable = this.$observables[name];
    if (observable) {
      return observable;
    }
  }
  if (this.$parent) {
    return this.$parent.$getObservable(name);
  }
  return null;
};

export const VueRxSync = {
  install(Vue, options) {
    Vue.prototype.$rxSync = rxSync(options);
    Vue.prototype.$getObservable = getObservable;
  }
};
