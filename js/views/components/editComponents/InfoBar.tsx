import * as React from 'react'; import { Component } from 'react';
import {
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { styles, screenWidth } from '../../styles'


export class InfoBar extends Component<any, any> {

  render() {
    let barHeight = this.props.barHeight;
    if (this.props.largeIcon)
      barHeight = 75;
    else if (this.props.icon)
      barHeight = 50;
    return (
      <View>
        <View style={[styles.listView, {height: barHeight}]}>
          {this.props.largeIcon !== undefined ?
            <View style={[styles.centered, {width: 80, paddingRight:20} ]}>{this.props.largeIcon}</View> : undefined}
          {this.props.icon !== undefined ?
          <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
          {this.props.value !== undefined ?
            <Text numberOfLines={1} style={[styles.listText, this.props.labelStyle, this.props.style]}>{this.props.label}</Text>
            :
            <Text numberOfLines={1} style={[styles.listTextLarge, this.props.labelStyle, this.props.style]}>{this.props.label}</Text>
          }
          {this.props.value !== undefined ?
            <Text numberOfLines={1} style={[{flex:1, fontSize:16}, this.props.valueStyle, this.props.style]}>{this.props.value}</Text>
            :
            <View style={{flex:1}} />
          }
        </View>
      </View>
    );
  }
}
