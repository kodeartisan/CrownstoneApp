import { Alert, AppState } from 'react-native'

import { LOG }                                  from './logging/Log'
import { CLOUD }                                from './cloud/cloudAPI'
import { LocalizationUtil }                     from './native/LocalizationUtil'
import { Scheduler }                            from './logic/Scheduler'
import { BluenetPromises, Bluenet, NativeBus }  from './native/Proxy';
import { eventBus }                             from './util/eventBus'
import { userHasPlugsInSphere, getDeviceSpecs } from './util/DataUtil'
import { Util }                                 from './util/Util'


/**
 * this will handle pretty much anything that needs to be run on startup.
 *
 */
export const INITIALIZER = {
  /**
   * Init happens before start, it triggers
   */
  initialized: false,
  userReady: false,
  init: function() {
    LOG.info("INITIALIZER: called init.");
    if (this.initialized === false) {
      LOG.info("INITIALIZER: performing init.");

      // route the events to React Native
      Bluenet.rerouteEvents();

      // listen to the BLE events
      NativeBus.on(NativeBus.topics.bleStatus, (status) => {
        LOG.info("INITIALIZER: received NativeBus.topics.bleStatus event.");
        switch (status) {
          case "poweredOff":

            break;
          case "poweredOn":
            if (this.userReady) {
              BluenetPromises.isReady().then(() => {
                Bluenet.startScanningForCrownstonesUniqueOnly();
              });
            }
            break;
          case "unauthorized":

            break;
          default:

            break;
        }
      });

      // listen to the BLE events
      NativeBus.on(NativeBus.topics.locationStatus, (status) => {
        LOG.info("INITIALIZER: received NativeBus.topics.locationStatus event.");
        switch (status) {
          case "unknown":

            break;
          case "on":

            break;
          case "foreground":

            break;
          case "off":

            break;
          default:

            break;
        }
      });

      this.initialized = true;
    }
  },

  /**
   * Start the app after init
   */
  started: false,
  start: function(store) {
    LOG.info("INITIALIZER: called start.");
    if (this.started === false) {
      LOG.info("INITIALIZER: performing start.");

      // subscribe to iBeacons when the spheres in the cloud change.
      CLOUD.events.on('CloudSyncComplete_spheresChanged', () => {LocalizationUtil.trackSpheres(store);});

      // when the app is started we track spheres and scan for Crownstones
      eventBus.on('appStarted', () => {
        LOG.info("INITIALIZER: received appStarted event.");
        BluenetPromises.isReady()
          .then(() => {Bluenet.startScanningForCrownstonesUniqueOnly()});


        LocalizationUtil.trackSpheres(store);
        this.userReady = true;
      });

      // when a sphere is created, we track all spheres anew.
      eventBus.on('sphereCreated', () => {LocalizationUtil.trackSpheres(store);});

      // sync every 5 minutes
      Scheduler.setRepeatingTrigger('backgroundSync', {repeatEveryNSeconds:60*5});
      Scheduler.loadCallback('backgroundSync', () => {
        let state = store.getState();
        if (state.user.userId) {
          LOG.info("STARTING ROUTINE SYNCING IN BACKGROUND");
          CLOUD.sync(store, true).catch((err) => { LOG.error("Error during background sync: ", err)});
        }
      });


      // update the store based on new fields in the database
      refreshDatabase(store);

      // get the new state
      let state = store.getState();
      Bluenet.enableLoggingToFile((state.user.logging === true && state.user.developer === true));

      // update device specs:
      let currentDeviceSpecs = getDeviceSpecs(state);
      let deviceInDatabaseId = Util.data.getDeviceIdFromState(state, currentDeviceSpecs.address);
      if (currentDeviceSpecs.address && deviceInDatabaseId) {
        let deviceInDatabase = state.devices[deviceInDatabaseId];
        // if the address matches but the name does not, update the device name in the cloud.
        if (deviceInDatabase.address === currentDeviceSpecs.address && currentDeviceSpecs.name != deviceInDatabase.name) {
          store.dispatch({type: 'UPDATE_DEVICE_CONFIG', deviceId: deviceInDatabaseId, data: {name: currentDeviceSpecs.name}})
        }
      }

      // configure the CLOUD network handler.
      let handler = function(error) {
        Alert.alert(
          "Connection Problem",
          "Could not connect to the Cloud. Please check your internet connection.",
          [{text: 'OK', onPress: () => {eventBus.emit('hideLoading');}}]
        );
      };

      // set the global network error handler.
      CLOUD.setNetworkErrorHandler(handler);

      // listen to the state of the app: if it is in the foreground or background
      AppState.addEventListener('change', (appState) => {
        if (appState === "active") {

        }
      });


      // trigger the CalibrateTapToToggle tutorial for existing users.
      NativeBus.on(NativeBus.topics.enterSphere, (sphereId) => {
        let state = store.getState();
        if (deviceInDatabaseId &&
          (state.devices[deviceInDatabaseId].tapToToggleCalibration === null || state.devices[deviceInDatabaseId].tapToToggleCalibration === undefined)) {
          if (userHasPlugsInSphere(state,sphereId))
            eventBus.emit("CalibrateTapToToggle");
        }
      });
      this.started = true;
    }
  }
};

function refreshDatabase(store) {
  let state = store.getState();
  let refreshActions = [];
  let sphereIds = Object.keys(state.spheres);

  // refresh all fields that do not have an ID requirement
  refreshActions.push({type:'REFRESH_DEFAULTS'});
  for (let i = 0; i < sphereIds.length; i++) {
    let sphereId = sphereIds[i];
    if (Array.isArray(state.spheres[sphereId].presets)) {
      LOG.info("Initialize: transforming Preset dataType");
      store.dispatch({type:'REFRESH_DEFAULTS', sphereId: sphereId});
      refreshDatabase(store);
      return;
    }

    let stoneIds = Object.keys(state.spheres[sphereId].stones);
    let locationIds = Object.keys(state.spheres[sphereId].locations);
    let applianceIds = Object.keys(state.spheres[sphereId].appliances);
    let userIds = Object.keys(state.spheres[sphereId].users);
    let presetIds = Object.keys(state.spheres[sphereId].presets);

    refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, sphereOnly: true});
    stoneIds.forEach(    (stoneId)     => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, stoneId: stoneId});});
    locationIds.forEach( (locationId)  => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, locationId: locationId});});
    applianceIds.forEach((applianceId) => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, applianceId: applianceId});});
    userIds.forEach(     (userId)      => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, userId: userId});});
    presetIds.forEach(   (presetId)    => { refreshActions.push({type:'REFRESH_DEFAULTS', sphereId: sphereId, presetId: presetId});});
  }
  store.batchDispatch(refreshActions);
}