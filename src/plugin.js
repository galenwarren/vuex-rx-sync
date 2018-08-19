import { combineLatest, of } from 'rxjs';
import { pluck, switchMap, map } from 'rxjs/operators';
import { syncObservableRefCounted } from './sync';

/**
 * Watches a value through the provided vm, returning the current value
 * and just returning the new values
 */
export const watchFactory = vm => target => {
  return vm
    .$watchAsObservable(target, { immediate: true })
    .pipe(pluck('newValue'));
};

export const resolve = (value$, getKeys, getObservable, keyName = 'id') => {
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
    return { sync, resolve, watch: watchFactory(this) };
  };
};

// kgw consider contributing this to vue-rx?
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
    // kgw remove if contribute to vue-rx
    Vue.prototype.$getObservable = getObservable;

    const sync = syncObservableRefCounted(options);

    Vue.prototype.$rxSync = function() {
      return {
        sync,
        resolve,
        watch: watchFactory(this),
      };
    };

    // the vm we use for off-component watching
    let vmWatch = null;

    Vue.$rxSync = {
      sync,
      resolve,
      get watch() {
        if (!vmWatch) {
          vmWatch = new Vue();
        }
        return watchFactory(vmWatch);
      },
    };
  },
};
