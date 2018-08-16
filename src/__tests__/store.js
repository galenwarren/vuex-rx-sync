import Vue from "vue";

import {
  SET_MUTATION,
  DELETE_MUTATION,
  crackStorePath,
  rxSyncMutations
} from "../store";

describe("vuex", () => {
  describe("crackStorePath", () => {
    it("works with a path of length 2", () => {
      expect(crackStorePath(["a", "b"])).toEqual({
        trunkPath: ["a"],
        leafKey: "b"
      });
    });

    it("works with a path of length 1", () => {
      expect(crackStorePath(["a"])).toEqual({ trunkPath: [], leafKey: "a" });
    });

    it("fails with a path of length 0", () => {
      expect(() => crackStorePath([])).toThrow("Invalid path");
    });
  });

  describe("rxSyncMutations", () => {
    describe(SET_MUTATION, () => {
      const vueSet = jest.spyOn(Vue, "set");

      const setMutation = rxSyncMutations[SET_MUTATION];

      it("sets a shallow value", () => {
        const state = {};
        setMutation(state, { path: ["key1"], value: 1 });
        expect(state.key1).toBe(1);
        expect(vueSet).toHaveBeenCalledTimes(1);
        expect(vueSet).toHaveBeenCalledWith(state, "key1", 1);
      });

      it("updates a shallow value", () => {
        const state = { key1: 0 };
        setMutation(state, { path: ["key1"], value: 1 });
        expect(state.key1).toBe(1);
        expect(vueSet).toHaveBeenCalledTimes(1);
        expect(vueSet).toHaveBeenCalledWith(state, "key1", 1);
      });

      it("sets a deep value", () => {
        const state = { key1: {} };
        setMutation(state, { path: ["key1", "key2"], value: 1 });
        expect(state.key1.key2).toBe(1);
        expect(vueSet).toHaveBeenCalledTimes(1);
        expect(vueSet).toHaveBeenCalledWith(state.key1, "key2", 1);
      });

      it("updates a deep value", () => {
        const state = { key1: { key2: 0 } };
        setMutation(state, { path: ["key1", "key2"], value: 1 });
        expect(state.key1.key2).toBe(1);
        expect(vueSet).toHaveBeenCalledTimes(1);
        expect(vueSet).toHaveBeenCalledWith(state.key1, "key2", 1);
      });

      it("updates a deep value through nonexistent path", () => {
        const state = { key1: {} };
        setMutation(state, { path: ["key1", "key2", "key3"], value: 1 });
        expect(state.key1.key2.key3).toBe(1);
        expect(vueSet).toHaveBeenCalledTimes(2);
        expect(vueSet).toHaveBeenNthCalledWith(2, state.key1.key2, "key3", 1);
      });
    });

    describe(DELETE_MUTATION, () => {
      const vueDelete = jest.spyOn(Vue, "delete");

      const deleteMutation = rxSyncMutations[DELETE_MUTATION];

      it("deletes a shallow value", () => {
        const state = { key1: 1 };
        deleteMutation(state, { path: ["key1"] });
        expect("key1" in state).toBe(false);
        expect(vueDelete).toHaveBeenCalledTimes(1);
        expect(vueDelete).toHaveBeenCalledWith(state, "key1");
      });

      it("deletes a deep value", () => {
        const state = { key1: { key2: 1 } };
        deleteMutation(state, { path: ["key1", "key2"] });
        expect("key2" in state.key1).toBe(false);
        expect(vueDelete).toHaveBeenCalledTimes(1);
        expect(vueDelete).toHaveBeenCalledWith(state.key1, "key2");
      });

      it("fails to delete a deep value through nonexistent path", () => {
        const state = { key1: { key2: 1 } };
        expect(() => deleteMutation(state, { path: ["key2", "key2"] })).toThrow(
          "Unable to delete value at invalid path"
        );
      });
    });
  });
});
