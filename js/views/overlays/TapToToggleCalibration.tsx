import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { LOG }                                        from '../../logging/Log'
import { BlePromiseManager }                          from '../../logic/BlePromiseManager'
import { addDistanceToRssi, Util }                    from '../../util/Util'
import { OverlayBox }                                 from '../components/overlays/OverlayBox'
import { eventBus }                                   from '../../util/EventBus'
import { styles, colors , screenHeight, screenWidth } from '../styles'

export class TapToToggleCalibration extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

    this.state = { visible: false, step:0, tutorial: true, canClose: false};
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("CalibrateTapToToggle", (data : any = {}) => {
      let state = this.props.store.getState();
      if (state.app.tapToToggleEnabled !== false) {
        eventBus.emit("ignoreTriggers");
        this.setState({
          visible: true,
          step: data.tutorial === false ? 1 : 0,
          tutorial: data.tutorial === undefined ? true  : data.tutorial
        });
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }


  learnDistance(attempt = 0) {
    // show loading screen
    eventBus.emit("showLoading", "Waiting to start learning...");

    // make sure we don't strangely trigger stuff while doing this.
    eventBus.emit("ignoreTriggers");

    let learnDistancePromise = () => {
      return new Promise((resolve, reject) => {
        eventBus.emit("showLoading", "Finding Tap-to-Toggle distance...");
        // timeout for the user to put his phone on the
        setTimeout(() => {
          eventBus.emit("showLoading", "Learning Tap-to-Toggle distance...");
          // waiting for the data to be collected. We use the RSSI updates through the iBeacon messages which come in at
          // StoneStateHandler.js ~ line 35
          setTimeout(() => {
            let state = this.props.store.getState();
            let sphereIds = Object.keys(state.spheres);
            let minRSSI = -1000;

            // search through all present spheres  that are not disabled and have RSSI indicators
            sphereIds.forEach((sphereId) => {
              let sphere = state.spheres[sphereId];
              if (sphere.state.present === true) {
                let stoneIds = Object.keys(sphere.stones);
                stoneIds.forEach((stoneId) => {
                  let stone = sphere.stones[stoneId];
                  if (stone.config.disabled === false) {
                    minRSSI = Math.max(stone.config.rssi, minRSSI);
                  }
                });
              }
            });
            LOG.info("TapToToggleCalibration: measured RSSI", minRSSI);
            resolve(minRSSI);
          }, 3500);
        }, 1000);
      })
    };

    BlePromiseManager.registerPriority(learnDistancePromise, {from:'Tap-to-toggle distance estimation.'})
      .then((nearestRSSI : number) => {
        if (nearestRSSI > -70) {
          let rssiAddedDistance = Math.max(nearestRSSI - 5, addDistanceToRssi(nearestRSSI, 0.1));
          LOG.info("TapToToggleCalibration: measured RSSI", nearestRSSI, 'added distance value:', rssiAddedDistance);

          let state = this.props.store.getState();
          let currentDeviceSpecs = Util.data.getDeviceSpecs(state);
          let deviceId = Util.data.getDeviceIdFromState(state, currentDeviceSpecs.address);
          this.props.store.dispatch({
            type: 'UPDATE_DEVICE_CONFIG',
            deviceId: deviceId,
            data: { tapToToggleCalibration: rssiAddedDistance }
          });
          eventBus.emit("showLoading", "Great!");

          setTimeout(() => {
            eventBus.emit("hideLoading");
          }, 500);
          this.setState({step:2});
        }
        else {
          eventBus.emit("hideLoading");
          if (attempt === 2) {
            Alert.alert("That's a bit far away.", "Maybe try again later.",[{text:"OK"}])
          }
          else {
            let defaultAction = () => {this.learnDistance(attempt + 1)};
            Alert.alert("That's a bit far away.", "Try to hold your phone really close to a Crownstone and press OK to retry!", [{text:'OK', onPress: defaultAction }], { onDismiss: defaultAction })
          }

        }
      })
      .catch((err) => {
        LOG.error("TapToToggleCalibration error:", err);
        eventBus.emit("hideLoading");
        Alert.alert("Something went wrong", "Maybe try again later.", [{text:'OK'}])
      })
  }

  getContent() {
    let state = this.props.store.getState();
    let presentSphereId = Util.data.getPresentSphereId(state);

    let props : any = {};
    switch(this.state.step) {
      case 0:
        props = {
          title: 'Using Tap-to-Toggle',
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkBlank.png'),
          header: "Now that you've added a Crownstone, you can use tap-to-toggle!",
          explanation: "Tap-to-toggle means you can switch the Crownstone just by holding your phone really close to it!",
          back: false,
          nextCallback: () => {this.setState({step:1});},
          nextLabel: 'Next'
        };
        break;
      case 1:
        props = {
          title: 'Setting it up',
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkBlank.png'),
          header: "In order to use tap-to-toggle, you need to help me a little.",
          explanation: "This will only take a minute and will only have to be done once. Hold your phone really close to a Crownstone and press 'Next'.",
          back: true,
          backCallback: () => {this.setState({step:0});},
          nextCallback: () => {this.learnDistance()},
          nextLabel: 'Next'
        };
        if (this.state.tutorial === false) {
          props.title = "Calibration";
          props.header = "To start calibrating tap-to-toggle, hold your phone very close to a plug and press 'Start'.";
          props.explanation = "The new distance will be used for all existing plugs.";
          props.back = false;
          props.nextLabel = 'Start';
        }
        break;
      case 2:
        props = {
          title: "Great!",
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkToggle.png'),
          header: "Now that I can recognise it with your phone, let's try tap-to-toggle!",
          explanation: "After you click 'Next' I'll enable tap-to-toggle and you can try it out! You can recalibrate your tap-to-toggle in the settings.",
          back: true,
          backCallback: () => {this.setState({step:1});},
          nextCallback: () => {eventBus.emit("useTriggers"); this.setState({step:3})},
          nextLabel: 'Next'
        };

        if (this.state.tutorial === false) {
          props.title = "Done!";
          props.header = "The new distance has been stored.";
          props.explanation = "Once you press 'Done' the new distance will be used for tap-to-toggle.";
          props.nextCallback = () => {eventBus.emit("useTriggers"); this.setState({visible: false})},
          props.nextLabel = 'Done'
        }
        break;
      case 3:
        props = {
          title: "Let's give it a try!",
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkToggle.png'),
          header: "Touch your phone to the Crownstone to trigger tap-to-toggle!",
          explanation: "Once the phone vibrates, it will start to toggle. If you're trying this on a built-in, make sure you enable tap-to-toggle in it's settings (Room overview -> Crownstone Overview -> Edit).",
          back: true,
          backCallback: () => {this.setState({step:1});},
          nextCallback: () => {this.setState({visible: false});},
          nextLabel: 'Finish!'
        };
        break;
    }

    if (!presentSphereId) {
      props = {
        title: 'Training Tap-to-Toggle',
        image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkBlank.png'),
        header: "Tap-to-toggle can only be trained if you're in a Sphere.",
        explanation: 'Try it again later when you\'re in your Sphere',
        back: false,
        nextCallback: () => { this.setState({visible: false});},
        nextLabel: 'OK'
      };
    }

    return (
      <View style={{flex:1, alignItems:'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.csBlue.hex, padding:15}}>{props.title}</Text>
        <Image source={props.image} style={{width:0.45*screenWidth, height:0.45*screenWidth, margin:0.025*screenHeight}} />
        <Text style={{fontSize: 14, fontWeight: 'bold', color: colors.csBlue.hex, textAlign:'center'}}>{props.header}</Text>
        <View style={{flex:1}}/>
        <Text style={{fontSize: 12, color: colors.blue.hex, textAlign:'center', paddingLeft:10, paddingRight:10}}>{props.explanation}</Text>
        <View style={{flex:1}}/>
        { props.back ?
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={props.backCallback} style={[styles.centered, {
              width: 0.3 * screenWidth,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: colors.blue.rgba(0.2),
            }]}>
              <Text style={{fontSize: 14, color: colors.blue.rgba(0.6)}}>Back</Text>
            </TouchableOpacity>
            <View style={{flex: 1}}/>
            <TouchableOpacity onPress={props.nextCallback} style={[styles.centered, {
              width: 0.3 * screenWidth,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: colors.blue.rgba(0.5),
            }]}>
              <Text style={{fontSize: 14, color: colors.blue.hex}}>{props.nextLabel}</Text>
            </TouchableOpacity>
          </View>
          :
          <TouchableOpacity onPress={props.nextCallback} style={[styles.centered, {
            width: 0.4 * screenWidth,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.blue.rgba(0.5),
          }]}>
            <Text style={{fontSize: 14, color: colors.blue.hex}}>{props.nextLabel}</Text>
          </TouchableOpacity>
        }
      </View>
    )
  }

  abortCloseCallback() {
    // when closed without training, tell the user where to find the calibration button.
    if (this.state.tutorial === true) {
      let explanationLabel = "You can calibrate tap to toggle through the settings menu any time.";
      if (Platform.OS === 'android') {
        explanationLabel = "You can calibrate tap to toggle through the side menu any time.";
      }
      Alert.alert("Training Tap-to-Toggle Later", explanationLabel, [{text:'OK'}])
    }
    eventBus.emit("useTriggers");
    this.setState({visible: false});
  }

  render() {
    return (
      <OverlayBox
        visible={this.state.visible} canClose={true}
        closeCallback={() => {this.abortCloseCallback();}}
        overrideBackButton={() => { if (this.state.step === 0) { this.abortCloseCallback(); }}}
        backgroundColor={colors.csBlue.rgba(0.3)}
        width={Math.min(320, 0.9*screenWidth)}
        height={Math.min(500, 0.95*screenHeight)}
      >
        {this.getContent()}
      </OverlayBox>
    );
  }
}