import { VuexRxSyncConfig } from '../config';
import { DEFAULT_DISPOSE_DELAY } from '../constants';
import { SET_MUTATION, DELETE_MUTATION } from '../store';

describe('VuexRxSyncConfig', () => {
  let store = null;
  let createDataObservable = null;
  let config = null;

  beforeEach(() => {
    store = {
      state: {
        property1: 1,
      },
      commit: jest.fn(),
    };
    createDataObservable = jest.fn();
    config = new VuexRxSyncConfig({ store, createDataObservable });
  });

  describe('constructor', () => {
    it('should fail if store not supplied', () => {
      expect(() => {
        new VuexRxSyncConfig({ createDataObservable: () => {} });
      }).toThrow('store is required');
    });

    it('should fail if createDataObservable not supplied', () => {
      expect(() => {
        new VuexRxSyncConfig({ store: {} });
      }).toThrow('createDataObservable is required');
    });

    it('should store properties on object', () => {
      const store = {};
      const createDataObservable = () => {};
      const config = new VuexRxSyncConfig({ store, createDataObservable });
      expect(config.store).toEqual(store);
      expect(config.createDataObservable).toEqual(createDataObservable);
    });
  });

  describe('disposeDelay', () => {
    it('should return the expected value', () => {
      expect(config.disposeDelay).toEqual(DEFAULT_DISPOSE_DELAY);
    });
  });

  describe('getStoreValue', () => {
    it('should return the defined value', () => {
      expect(config.getStoreValue(['property1'])).toEqual(1);
    });

    it('should return undefined for missing immediate property', () => {
      expect(config.getStoreValue(['property2'])).toEqual(undefined);
    });

    it('should return undefined for missing immediate property', () => {
      expect(config.getStoreValue(['property1', 'property2'])).toEqual(
        undefined
      );
    });
  });

  describe('setStoreValue', () => {
    const path = ['property1'];
    const value = 3;

    it('should generate the proper mutation', () => {
      config.setStoreValue(path, value);
      expect(config.store.commit).toHaveBeenCalledWith(SET_MUTATION, {
        path,
        value,
      });
    });
  });

  describe('deleteStoreValue', () => {
    it('should generate the proper mutation', () => {
      const path = ['property1'];
      const value = 3;
      config.deleteStoreValue(path, value);
      expect(config.store.commit).toHaveBeenCalledWith(DELETE_MUTATION, {
        path,
      });
    });
  });

  describe('shouldDeleteStoreValue', () => {
    const path = ['property1'];

    it('should return true if value is undefined', () => {
      expect(config.shouldDeleteStoreValue(path, undefined)).toEqual(true);
    });

    it('should return false if value is defined', () => {
      expect(config.shouldDeleteStoreValue(path, 1)).toEqual(false);
      expect(config.shouldDeleteStoreValue(path, null)).toEqual(false);
      expect(config.shouldDeleteStoreValue(path, '')).toEqual(false);
      expect(config.shouldDeleteStoreValue(path, false)).toEqual(false);
    });
  });

  describe('updateStore', () => {
    const path = ['property1'];
    const value = 3;

    it('should properly update value', () => {
      config.shouldDeleteStoreValue = jest.fn(() => false);
      config.setStoreValue = jest.fn();
      config.deleteStoreValue = jest.fn();

      config.updateStore(path, value);

      expect(config.shouldDeleteStoreValue).toHaveBeenCalledWith(path, value);
      expect(config.deleteStoreValue).toHaveBeenCalledTimes(0);
      expect(config.setStoreValue).toHaveBeenCalledWith(path, value);
    });

    it('should properly delete value', () => {
      config.shouldDeleteStoreValue = jest.fn(() => true);
      config.setStoreValue = jest.fn();
      config.deleteStoreValue = jest.fn();

      config.updateStore(path, value);

      expect(config.shouldDeleteStoreValue).toHaveBeenCalledWith(path, value);
      expect(config.setStoreValue).toHaveBeenCalledTimes(0);
      expect(config.deleteStoreValue).toHaveBeenCalledWith(path);
    });
  });

  describe('resetStore', () => {
    const path = ['property1'];

    it('should delete the store value', () => {
      config.deleteStoreValue = jest.fn();
      config.resetStore(path);
      expect(config.deleteStoreValue).toHaveBeenCalledWith(path);
    });
  });
});
