import { pluck } from 'rxjs/operators';
import { syncObservableRefCounted } from './sync';
import { findObservable } from './util';
import { resolve, addAttribute } from './operators';

export function watchFactory(vm) {
  return target =>
    vm.$watchAsObservable(target, { immediate: true }).pipe(pluck('newValue'));
}

export const VuexRxSync = {
  install(Vue, options) {
    // create the sync function to expose here
    const { sync, reset } = syncObservableRefCounted(options);

    // the base context information, everything but 'watch'
    const context = { sync, resolve, addAttribute, reset };

    // assign the $findObservable helper
    Vue.prototype.$findObservable = findObservable;

    // assign the $rxSync property
    Object.defineProperty(Vue.prototype, '$rxSync', {
      get: function() {
        return Object.assign({}, context, {
          watch: watchFactory(this),
        });
      },
    });

    // the vm we use for off-component watching
    let vmWatch = null;

    // assing a global $rxSync with a watch that uses the
    // Vue instance above
    Vue.$rxSync = Object.assign({}, context, {
      get watch() {
        if (!vmWatch) {
          vmWatch = new Vue();
        }
        return watchFactory(vmWatch);
      },
    });
  },
};
