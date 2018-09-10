import { Observable } from 'rxjs';
import objectPath from 'object-path';
import { SET_MUTATION, DELETE_MUTATION } from './store';
import { DEFAULT_DISPOSE_DELAY } from './constants';

export class VuexRxSyncConfig {
  constructor(store, options = {}) {
    this.store = store;
    Object.assign(this, options);
  }

  get disposeDelay() {
    return DEFAULT_DISPOSE_DELAY;
  }

  getStoreValue(path) {
    return objectPath.get(this.store.state, path);
  }

  setStoreValue(path, value) {
    this.store.commit(SET_MUTATION, { path, value });
  }

  deleteStoreValue(path) {
    this.store.commit(DELETE_MUTATION, { path });
  }

  createStoreObservable(path) {
    // ensure reactive
    this.setStoreValue(path, this.getStoreValue(path));

    // the observable for the value in the store we have just ensured exists
    return Observable.create(subscriber => {
      return this.store.watch(
        () => this.getStoreValue(path),
        value => subscriber.next(value)
      );
    });
  }

  shouldDeleteStoreValue(path, value) {
    return value === undefined;
  }

  updateStore(path, value) {
    if (this.shouldDeleteStoreValue(path, value)) {
      this.deleteStoreValue(path);
    } else {
      this.setStoreValue(path, value);
    }
  }

  resetStore(path) {
    this.deleteStoreValue(path);
  }
}
