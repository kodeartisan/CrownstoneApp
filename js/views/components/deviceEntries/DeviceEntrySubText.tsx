import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
  Image,
  PixelRatio,
  Platform,
  Switch,
  TouchableOpacity,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { colors}             from '../../styles'
import { SetupStateHandler } from "../../../native/setup/SetupStateHandler";
import { STONE_TYPES }       from "../../../router/store/reducers/stones";

export class DeviceEntrySubText extends Component<any, any> {
  render() {
    let currentUsage = this.props.currentUsage;
    let rssi = this.props.rssi;
    let disabled = this.props.disabled;
    let measuresPower = this.props.deviceType === STONE_TYPES.plug || this.props.deviceType === STONE_TYPES.builtin;

    if (this.props.statusTextOverride) {
      return (
        <View style={{flexDirection:'row'}}>
          <Text style={{fontSize: 12}}>{this.props.statusTextOverride}</Text>
        </View>
      )
    }

    if (disabled === false && currentUsage !== undefined && measuresPower) {
      // show it in orange if it's in tap to toggle range
      let color = colors.iosBlue.hex;
      if (this.props.tap2toggleThreshold && rssi >= this.props.tap2toggleThreshold && this.props.tap2toggleEnabled) {
        color = colors.orange.hex;
      }

      if (this.props.statusText) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{this.props.statusText}</Text>
          </View>
        )
      }

      if (this.props.nearestInSphere === true) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Nearest)'}</Text>
          </View>
        )
      }
      else if (this.props.nearestInRoom === true) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Nearest in room)'}</Text>
          </View>
        )
      }
      else if (rssi > -60) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Very near)'}</Text>
          </View>
        )
      }
      else if (rssi > -70) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Near)'}</Text>
          </View>
        )
      }
      else {
        return <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
      }
    }
    else if (disabled === false) {
      if (this.props.nearest === true) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{'(Nearest)'}</Text>
      }
      else if (rssi > -60) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{'(Very near)'}</Text>
      }
      else if (rssi > -70) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{'(Near)'}</Text>
      }
      else {
        return <View />
      }
    }
    else if (disabled === true) {
      return (
        <Text style={{fontSize: 12}}>
          { SetupStateHandler.isSetupInProgress() ? 'Please wait until the setup process is complete.' : 'Searching...' }
        </Text>
      );
    }
    else {
      return <View />
    }
  }
}