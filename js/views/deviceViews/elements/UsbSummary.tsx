import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import { colors, screenWidth, screenHeight } from '../../styles'
import { Util }                from "../../../util/Util";
import { Icon }                from "../../components/Icon";
import { StoneUtil }           from "../../../util/StoneUtil";
import { AnimatedCircle }      from "../../components/animated/AnimatedCircle";
import { DimmerButton }        from "../../components/DimmerButton";
import { INTENTS }             from "../../../native/libInterface/Constants";
import { Permissions}          from "../../../backgroundProcesses/PermissionManager";
import { EventBusClass}        from "../../../util/EventBus";
import { LockedStateUI}        from "../../components/LockedStateUI";
import { BatchCommandHandler } from "../../../logic/BatchCommandHandler";
import {DeviceButton, DeviceInformation} from "./DeviceSummary";

export class UsbSummary extends Component<any, any> {
  storedSwitchState = 0;
  unsubscribeStoreEvents;

  constructor(props) {
    super(props);
    this.state = {pendingCommand: false};

    const state = props.store.getState();
    const sphere = state.spheres[props.sphereId];
    const stone = sphere.stones[props.stoneId];
    this.storedSwitchState = stone.state.state;
  }



  _getLockIcon(stone) {
    let wrapperStyle = {
      width: 35,
      height: 35,
      position: 'absolute',
      bottom: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: "center"
    };
    if (stone.config.disabled === false && stone.config.locked === false) {
      return (
        <TouchableOpacity
          onPress={() => {this.props.eventBus.emit('showLockOverlay', { sphereId: this.props.sphereId, stoneId: this.props.stoneId })}}
          style={wrapperStyle}>
          <Icon name={"md-unlock"} color={colors.white.rgba(0.5)} size={30}/>
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle} />;
    }
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const location = Util.data.getLocationFromStone(sphere, stone);

    // stone.config.disabled = false
    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    let locationLabel = "Tap here to move me!";
    let locationName = "Not in room";
    if (location) {
      locationLabel = "Located in:";
      locationName = location.config.name;
    }


    return (
      <View style={{flex:1, paddingBottom: 35}}>
        <DeviceInformation
          right={locationLabel}
          rightValue={locationName}
          rightTapAction={spherePermissions.moveCrownstone ? () => { Actions.roomSelection({sphereId: this.props.sphereId,stoneId: this.props.stoneId,locationId: this.props.locationId}); } : null}
        />
        <View style={{flex:1}} />
        <View style={{width:screenWidth, alignItems: 'center' }}>
          <DeviceButton
            store={this.props.store}
            eventBus={this.props.eventBus}
            stoneId={this.props.stoneId}
            sphereId={this.props.sphereId}
          />
        </View>
        <View style={{flex:1.5}} />
      </View>
    )
  }
}
