import { Platform } from 'react-native';
import { Scheduler } from '../logic/Scheduler'
import { eventBus } from '../util/EventBus'
import {cleanLogs} from "./LogUtil";
import {LOG} from "./Log";
import {LOG_LEVEL} from "./LogLevels";

const DeviceInfo = require('react-native-device-info');

class LogProcessorClass {
  store : any;
  writeToFile:        boolean;
  log_info:           number = LOG_LEVEL.NONE;
  log_warnings:       number = LOG_LEVEL.NONE;
  log_errors:         number = LOG_LEVEL.NONE;
  log_mesh:           number = LOG_LEVEL.NONE;
  log_native:         number = LOG_LEVEL.NONE;
  log_scheduler:      number = LOG_LEVEL.NONE;
  log_verbose:        number = LOG_LEVEL.NONE;
  log_advertisements: number = LOG_LEVEL.NONE;
  log_ble:            number = LOG_LEVEL.NONE;
  log_events:         number = LOG_LEVEL.NONE;
  log_store:          number = LOG_LEVEL.NONE;
  log_cloud:          number = LOG_LEVEL.NONE;
  log_debug:          number = LOG_LEVEL.NONE;

  constructor() {
    this.store = undefined;
    this.writeToFile = false;

  }

  loadStore(store) {
    this.store = store;

    // use periodic events to clean the logs.
    let triggerId = "LOG_CLEANING_TRIGGER";
    Scheduler.setRepeatingTrigger(triggerId, {repeatEveryNSeconds: 5*3600});
    Scheduler.loadCallback(triggerId,() => { cleanLogs() }, true);

    eventBus.on("databaseChange", (data) => {
      if (data.change.changeUserDeveloperStatus || data.change.changeDeveloperData) {
        this.refreshData();
      }
    });
    this.refreshData();

    LOG.info("Device Manufacturer", DeviceInfo.getManufacturer());  // e.g. Apple
    LOG.info("Device Brand", DeviceInfo.getBrand());  // e.g. Apple / htc / Xiaomi
    LOG.info("Device Model", DeviceInfo.getModel());  // e.g. iPhone 6
    LOG.info("Device ID", DeviceInfo.getDeviceId());  // e.g. iPhone7,2 / or the board on Android e.g. goldfish
    LOG.info("System Name", DeviceInfo.getSystemName());  // e.g. iPhone OS
    LOG.info("System Version", DeviceInfo.getSystemVersion());  // e.g. 9.0
    LOG.info("Bundle ID", DeviceInfo.getBundleId());  // e.g. com.learnium.mobile
    LOG.info("Build Number", DeviceInfo.getBuildNumber());  // e.g. 89
    LOG.info("App Version", DeviceInfo.getVersion());  // e.g. 1.1.0
    LOG.info("App Version (Readable)", DeviceInfo.getReadableVersion());  // e.g. 1.1.0.89
    LOG.info("Device Name", DeviceInfo.getDeviceName());  // e.g. Becca's iPhone 6
    LOG.info("User Agent", DeviceInfo.getUserAgent()); // e.g. Dalvik/2.1.0 (Linux; U; Android 5.1; Google Nexus 4 - 5.1.0 - API 22 - 768x1280 Build/LMY47D)
    LOG.info("Device Locale", DeviceInfo.getDeviceLocale()); // e.g en-US
    LOG.info("Device Country", DeviceInfo.getDeviceCountry()); // e.g US
    LOG.info("App Instance ID", DeviceInfo.getInstanceID()); // ANDROID ONLY - see https://developers.google.com/instance-id/

    // console.log("getAPILevel()", DeviceInfo.getAPILevel());
    // console.log("getApplicationName()", DeviceInfo.getApplicationName());
    // console.log("getBrand()", DeviceInfo.getBrand());
    // console.log("getBuildNumber()", DeviceInfo.getBuildNumber());
    // console.log("getBundleId()", DeviceInfo.getBundleId());
    // console.log("getCarrier()", DeviceInfo.getCarrier());
    // console.log("getDeviceCountry()", DeviceInfo.getDeviceCountry());
    // console.log("getDeviceId()", DeviceInfo.getDeviceId());
    // console.log("getDeviceLocale()", DeviceInfo.getDeviceLocale());
    // console.log("getDeviceName()", DeviceInfo.getDeviceName());
    // console.log("getFirstInstallTime()", DeviceInfo.getFirstInstallTime());
    // console.log("getFontScale()", DeviceInfo.getFontScale());
    // console.log("getFreeDiskStorage()", DeviceInfo.getFreeDiskStorage());
    // console.log("getInstallReferrer()", DeviceInfo.getInstallReferrer());
    // console.log("getInstanceID()", DeviceInfo.getInstanceID());
    // console.log("getLastUpdateTime()", DeviceInfo.getLastUpdateTime());
    // console.log("getManufacturer()", DeviceInfo.getManufacturer());
    // console.log("getMaxMemory()", DeviceInfo.getMaxMemory());
    // console.log("getModel()", DeviceInfo.getModel());
    // console.log("getPhoneNumber()", DeviceInfo.getPhoneNumber());
    // console.log("getReadableVersion()", DeviceInfo.getReadableVersion());
    // console.log("getSerialNumber()", DeviceInfo.getSerialNumber());
    // console.log("getSystemName()", DeviceInfo.getSystemName());
    // console.log("getSystemVersion()", DeviceInfo.getSystemVersion());
    // console.log("getTimezone()", DeviceInfo.getTimezone());
    // console.log("getTotalDiskCapacity()", DeviceInfo.getTotalDiskCapacity());
    // console.log("getTotalMemory()", DeviceInfo.getTotalMemory());
    // console.log("getUniqueID()", DeviceInfo.getUniqueID());
    // console.log("getUserAgent()", DeviceInfo.getUserAgent());
    // console.log("getVersion()", DeviceInfo.getVersion());
    // console.log("is24Hour()", DeviceInfo.is24Hour());
    // console.log("isEmulator()", DeviceInfo.isEmulator());
    // console.log("isPinOrFingerprintSet()", DeviceInfo.isPinOrFingerprintSet());
    // console.log("isTablet()", DeviceInfo.isTablet());
  }

  refreshData() {
    if (this.store) {
      let state = this.store.getState();
      let dev = state.user.developer;
      let log = state.user.logging;
      let devState = state.development;

      this.writeToFile = dev === true && log === true;

      this.log_info           = dev === true && log === true && devState.log_info           === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_warnings       = dev === true && log === true && devState.log_warnings       === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_errors         = dev === true && log === true && devState.log_errors         === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_mesh           = dev === true && log === true && devState.log_mesh           === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_native         = dev === true && log === true && devState.log_native         === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_scheduler      = dev === true && log === true && devState.log_scheduler      === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_verbose        = dev === true && log === true && devState.log_verbose        === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_ble            = dev === true && log === true && devState.log_ble            === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_advertisements = dev === true && log === true && devState.log_advertisements === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_events         = dev === true && log === true && devState.log_events         === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_store          = dev === true && log === true && devState.log_store          === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_cloud          = dev === true && log === true && devState.log_cloud          === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
      this.log_debug          = dev === true && log === true && devState.log_debug          === true ? LOG_LEVEL.INFO : LOG_LEVEL.NONE;
    }
  }
}

export const LogProcessor : any = new LogProcessorClass();
