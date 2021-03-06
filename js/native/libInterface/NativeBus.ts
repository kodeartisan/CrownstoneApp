import { Alert, NativeModules, NativeEventEmitter } from 'react-native';
import {LOG, LOGi} from '../../logging/Log'
import { Util } from "../../util/Util";
import {DISABLE_NATIVE} from "../../ExternalConfig";

let BluenetEmitter = { addListener: (a,b) => { return {remove:() => {}} }};

if (DISABLE_NATIVE !== true) {
  BluenetEmitter = new NativeEventEmitter(NativeModules.BluenetJS);
}

class NativeBusClass {
  topics: any;
  refMap: any;

  _registeredEvents = {};

  constructor() {
    this.topics = {
      setupAdvertisement:   "verifiedSetupAdvertisementData",   // data type = crownstoneAdvertisement
      dfuAdvertisement:     "verifiedDFUAdvertisementData",     // data type = crownstoneAdvertisement
      advertisement:        "verifiedAdvertisementData",        // data type = crownstoneAdvertisement // = from crownstone in normal operation mode.
      anyAdvertisement:     "anyVerifiedAdvertisementData",     // data type = crownstoneAdvertisement
      setupProgress:        "setupProgress",                    // data type = number ([1 .. 13], 0 for error)
      dfuProgress:          "dfuProgress",                      // data type = {percentage: number, part: number, totalParts: number, progress: number, currentSpeedBytesPerSecond: number, avgSpeedBytesPerSecond: number}
      bleStatus:            "bleStatus",                        // data type = string ("unauthorized", "poweredOff", "poweredOn", "unknown")
      locationStatus:       "locationStatus",                   // data type = string ("unknown", "off", "foreground", "on", "noPermission")

      nearest:              "nearestCrownstone",                // data type = type_nearest
      nearestSetup:         "nearestSetupCrownstone",           // data type = type_nearest

      iBeaconAdvertisement: "iBeaconAdvertisement",             // data type = type_beacon[]
      enterSphere:          "enterSphere",                      // data type = string (sphereId)
      exitSphere:           "exitSphere",                       // data type = string (sphereId)
      enterRoom:            "enterLocation",                    // data type = {region: sphereId, location: locationId}
      exitRoom:             "exitLocation",                     // data type = {region: sphereId, location: locationId}
      currentRoom:          "currentLocation",                  // data type = {region: sphereId, location: locationId}

      libAlert:             "libAlert",                         // data type = {header: string, body: string, buttonText: string }
      libPopup:             "libPopup",                         // data type = {header: string, body: string, buttonText: string, type: <not used yet> }

      classifierProbabilities: "classifierProbabilities",       // data type = {locationId: {sampleSize: number, probability: number }}
      classifierResult:        "classifierResult",              // data type = {valid: boolean, highestPredictionLabel: string, highestPrediction: number }
    };

    this.refMap = {};
    Object.keys(this.topics).forEach((key) => {
      this.refMap[this.topics[key]] = true;
    });
  }

  on(topic, callback) {
    if (!(topic)) {
      LOG.error("Attempting to subscribe to undefined topic:", topic);
      return;
    }
    if (!(callback)) {
      LOG.error("Attempting to subscribe without callback to topic:", topic);
      return;
    }
    if (this.refMap[topic] === undefined) {
      LOG.error("Attempting to subscribe to a topic that does not exist in the native bus.", topic);
      return;
    }

    // generate unique id
    let id = Util.getUUID();

    // subscribe to native event.
    let subscription = BluenetEmitter.addListener(topic, callback);

    let removeCallback = () => {
      subscription.remove();
      this._registeredEvents[id] = undefined;
      delete this._registeredEvents[id];
    };

    this._registeredEvents[id] = removeCallback;

    // return unsubscribe function.
    return removeCallback;
  }

  clearAllEvents() {
    LOGi.info("Clearing all native event listeners.");
    let keys = Object.keys(this._registeredEvents);
    keys.forEach((key) => {
      if (typeof this._registeredEvents[key] === 'function') {
        this._registeredEvents[key]();
      }
    });
  }
}

export const NativeBus = new NativeBusClass();


/** type defs **/

// type type_nearest = {
//   name      : string,
//   handle    : string,
//   rssi      : number,
//   setupMode : boolean
// }
//
// type type_beacon = {
//   id        : string,
//   uuid      : string,
//   major     : number,
//   minor     : number,
//   rssi      : number,
//   referenceId : string,
// }


/** end of type **/