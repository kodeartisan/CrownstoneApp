import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  PanResponder,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {colors, screenWidth} from '../styles'
import {eventBus} from "../../util/EventBus";
import {AnimatedDial} from "./AnimatedDial";
import {Icon} from "./Icon";
import {LOGe} from "../../logging/Log";
import {Permissions} from "../../backgroundProcesses/PermissionManager";

export class LockedStateUI extends Component<any, any> {
  _panResponder;

  controlling = false;
  _startTime = 0;
  timeout;
  loadingAmountRequired;

  constructor(props) {
    super(props);

    this.props = props;
    this.state = {level: 0, unlockingInProgress: false, unlocked: false};
    this.loadingAmountRequired = 3000;

    this.init();
  }

  init() {
    // configure the pan responder
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => false,
      onPanResponderGrant: (evt, gestureState) => {
        if (Permissions.inSphere(this.props.sphereId).canUnlockCrownstone) {
          if (this.state.unlockingInProgress === false) {
            this.controlling = true;
            this._startTime = new Date().valueOf();
            this._updateLoop();
            eventBus.emit("UIGestureControl", false);
          }
        }
      },
      onPanResponderMove: (evt, gestureState) => {},

      onPanResponderRelease: (evt, gestureState) => {
        if (Permissions.inSphere(this.props.sphereId).canUnlockCrownstone) {
          this._startTime = 0;
          clearTimeout(this.timeout);
          if (this.state.level === 1) {
            this._unlockCrownstone()
          }
          else {
            this.setState({level: 0});
          }
          eventBus.emit("UIGestureControl", true)
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      },
    });
  }

  _unlockCrownstone() {
    this.setState({unlockingInProgress: true});

    this.props.unlockCrownstone()
      .then(() => {
        this.setState({ unlockingInProgress: false, unlocked: true });
        setTimeout(() => { this.props.unlockDataCallback() }, 500);
      })
      .catch((err) => {
        LOGe.info("LockedStateUI: failed to unlock Crownstone", err);
        this.setState({ unlockingInProgress: false, failed: true });
        setTimeout(() => { this.setState({ failed: false }); }, 1500);
      })
  }

  _updateLoop() {
    let level = 0;
    if (this.controlling) {
      level = Math.min(1,(new Date().valueOf() - this._startTime)/this.loadingAmountRequired);

      if (level === 1) {
        this.controlling = false;
        this.setState({level:1, failed: false});
        clearTimeout(this.timeout);
      }
      else {
        this.setState({level: level, failed: false});
        this.timeout = setTimeout(() => {
          this._updateLoop();
        }, 100);
      }
    }
  }


  _getContent() {
    let viewStyle = {width: this.props.size, height: this.props.size, position:'absolute', top:0, left:0, alignItems:'center', justifyContent:'center'};
    let textStyle = {fontSize:12, textAlign:'center', color: colors.white.hex, paddingTop:5, fontWeight: 'bold'};
    if (!Permissions.inSphere(this.props.sphereId).canUnlockCrownstone) {
      return (
        <View style={viewStyle}>
          <Icon
            name="md-lock"
            size={this.props.size*0.3}
            color={colors.white.hex}
          />
          <Text style={textStyle}>{"Ask an admin\nto unlock me!"}</Text>
        </View>
      )
    }

    if (this.state.unlockingInProgress) {
      return (
        <View style={viewStyle}>
          <ActivityIndicator animating={true} size='large' color={colors.white.hex} />
          <Text style={textStyle}>{"Unlocking..."}</Text>
        </View>
      )
    }
    else if (this.state.unlocked) {
      return (
        <View style={viewStyle}>
          <Icon
            name="md-unlock"
            size={this.props.size*0.3}
            color="#fff"
          />
          <Text style={textStyle}>{"Done"}</Text>
        </View>
      )
    }
    else if (this.state.failed) {
      return (
        <View style={viewStyle}>
          <Icon
            name="md-lock"
            size={this.props.size*0.3}
            color={colors.red.hex}
          />
          <Text style={textStyle}>{"Couldn't unlock...\nYou must be near."}</Text>
        </View>
      )
    }
    else {
      return (
        <View style={viewStyle}>
          <Icon
            name="md-lock"
            size={this.props.size*0.3}
            color={colors.white.hex}
          />
          <Text style={textStyle}>{"Press and hold\nto unlock!"}</Text>
        </View>
      )
    }
  }

  render() {
    return (
      <View  style={{width: screenWidth, height: this.props.size, alignItems:'center', justifyContent:'center'}}>
        <View {...this._panResponder.panHandlers} style={{width: this.props.size, height: this.props.size, alignItems:'center', justifyContent:'center'}}>
          <AnimatedDial width={this.props.size} height={this.props.size} level={this.state.level} blink={this.state.blink} />
          {this._getContent()}
        </View>
      </View>
  );
  }
}