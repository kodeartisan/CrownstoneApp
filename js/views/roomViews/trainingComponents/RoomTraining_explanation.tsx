import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View,
  Vibration
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, OrangeLine} from '../../styles'
import { Icon } from '../../components/Icon';

export class RoomTraining_explanation extends Component<any, any> {
  render() {
    return (
      <View style={{flex:1}}>
        <OrangeLine/>
        <View style={{flexDirection:'column', flex:1, padding:20, alignItems:'center'}}>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:20,
            fontWeight:'600',
            color: colors.white.hex,
            textAlign:'center'
          }}>{"OK, so it's a " + this.props.roomSize + " room. Let's start training " + this.props.roomName + '!'}</Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'300',
            color: colors.white.hex,
            textAlign:'center',
            paddingTop:20,
          }}>{"Walk around the room with your phone in your hand. " +
          "Try to get to every spot in the room, near the walls as well and through the center. " +
          "The teaching process takes " + this.props.sampleSize + " seconds and you can see the progress on your screen."}
          </Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'300',
            color: colors.white.hex,
            textAlign:'center',
            paddingTop:20,
            paddingBottom:20,
          }}>Press the button below to get started!
          </Text>

          <View style={{flex:1}} />
          <TouchableOpacity
            style={[{borderWidth:5, borderColor:"#fff", backgroundColor:colors.green.hex, width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth}, styles.centered]}
            onPress={() => { this.props.next() }}
          >
            <Icon name="c1-locationPin1" size={0.32*screenWidth} color="#fff" style={{backgroundColor:"transparent", position:'relative', top:0.01*screenWidth}} />
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      </View>
    );
  }
}