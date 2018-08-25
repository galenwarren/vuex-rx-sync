import Vue from 'vue';
import objectPath from 'object-path';
import log from 'picolog';

export const SET_MUTATION = 'vue-rx-sync/SET';
export const DELETE_MUTATION = 'vue-rx-sync/DELETE';

export const storeSet = store => (path, value) => {
  log.trace('storeSet', path, value);
  store.commit(SET_MUTATION, { path, value });
};

export const storeDelete = store => path => {
  log.trace('storeDelete', path);
  store.commit(DELETE_MUTATION, { path });
};

export function crackStorePath(path) {
  if (path.length < 1) {
    throw new Error(`Invalid path ${path}, length must be >= 1`);
  }

  const trunkPath = path.slice();
  const leafKey = trunkPath.pop();
  return { trunkPath, leafKey };
}

export const rxSyncMutations = {
  [SET_MUTATION](state, { path, value }) {
    const { trunkPath, leafKey } = crackStorePath(path);

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
    const { trunkPath, leafKey } = crackStorePath(path);
    const trunk = objectPath.get(state, trunkPath);
    if (!trunk) {
      throw new Error(
        `${DELETE_MUTATION}: Unable to delete value at invalid path ${path}`
      );
    }

    Vue.delete(trunk, leafKey);
  },
};
