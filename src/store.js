import Vue from 'vue';
import objectPath from 'object-path';
import { crackPath } from './util';

export const SET_MUTATION = 'vue-rx-sync/SET';
export const DELETE_MUTATION = 'vue-rx-sync/DELETE';

export const vuexRxSyncMutations = {
  [SET_MUTATION](state, { path, value }) {
    const { trunkPath, leafKey } = crackPath(path);

    const trunk = trunkPath.reduce((obj, propertyName) => {
      if (obj.hasOwnProperty(propertyName)) {
        return obj[propertyName];
      } else {
        const propertyValue = {};
        Vue.set(obj, propertyName, propertyValue);
        return propertyValue;
      }
    }, state);

    Vue.set(trunk, leafKey, value);
  },

  [DELETE_MUTATION](state, { path }) {
    const { trunkPath, leafKey } = crackPath(path);
    const trunk = objectPath.get(state, trunkPath);
    if (!trunk) {
      throw new Error(
        `${DELETE_MUTATION}: Unable to delete value at invalid path ${path}`
      );
    }

    Vue.delete(trunk, leafKey);
  },
};
