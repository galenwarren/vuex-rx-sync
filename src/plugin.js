import { Subscription } from "rxjs";
import { rxSyncObservable } from "./observable";

// remove dependency on vue-rx?
export const $rxSyncFactory = defaultOptions => {
  // don't use arrow syntax here, we want this to be set by Vue
  return function(options) {
    const observable = rxSyncObservable(
      Object.assign({ store: this.$store }, defaultOptions, options)
    );

    this.$subscribeTo(observable);
  };
};

export const $addSubscription = subscription => {
  if (!this._subscription) {
    this._subscription = new Subscription();
  }
  this._subscription.add(subscription);
};

export const VueRxSync = {
  install(Vue, defaultOptions) {
    const $rxSync = $rxSyncFactory(defaultOptions);
    Object.assign(Vue.prototype, { $rxSync, $addSubscription });
  }
};
