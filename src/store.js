import Vue from "vue";
import objectPath from "object-path";

export const SET_MUTATION = "rxSync/set";
export const DELETE_MUTATION = "rxSync/delete";

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
  }
};
