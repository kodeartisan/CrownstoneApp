import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  View
} from 'react-native';
import { SafeAreaView } from 'react-navigation';

export class ScaledImage extends Component<{source: any, targetWidth?: number, targetHeight?: number, sourceWidth: number, sourceHeight:number, style?:any}, any> {
  render() {
    let factor = this.props.sourceWidth/this.props.sourceHeight;
    let width = this.props.sourceWidth;
    let height = this.props.sourceHeight;
    if (this.props.targetWidth) {
      width = this.props.targetWidth;
      height = this.props.targetWidth/factor;
    }
    else if (this.props.targetHeight) {
      height = this.props.targetHeight;
      width = this.props.targetHeight*factor;
    }

    return (
      <Image source={this.props.source} style={[{width: width, height: height}, this.props.style]} />
    );
  }
}