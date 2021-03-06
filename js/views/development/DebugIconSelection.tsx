import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Image,
  PixelRatio,
  TouchableOpacity,
  ScrollView,
  Text,
  View
} from 'react-native';

import {styles, colors, screenWidth} from '../styles'
import {NavigationBar} from "../components/editComponents/NavigationBar";
import {Separator} from "../components/Separator";
import {SlideInView} from "../components/animated/SlideInView";
import {Icon} from "../components/Icon";
import {CustomIcon} from "../../fonts/customIcons";

let borderColor = 'rgba(0,0,0,0.1)';
let ROW_HEIGHT = 70;
let ICON_SIZE = 35;
let AMOUNT_OF_ITEMS_IN_ROW = 4;

export class DebugIconSelection extends Component<any, any> {
  icons: any = {};
  duplicates: any = {};

  constructor(props) {
    super(props);

    let stateContent:any = {};
    props.categories.forEach((category) => {
      stateContent[category.key] = false;
    });

    if (stateContent.__new !== undefined) {
      stateContent.__new = true;
    }

    AMOUNT_OF_ITEMS_IN_ROW = 3;
    ROW_HEIGHT = 250;
    ICON_SIZE = screenWidth / (AMOUNT_OF_ITEMS_IN_ROW + 1);
    let iconKeys = Object.keys(props.icons);
    let newOnes = {};
    iconKeys.forEach((key) => {
      props.icons[key].forEach((icon) => {
        if (this.icons[icon]) {
          this.duplicates[icon] = true;
          newOnes[icon] = false;
        }
        else {
          newOnes[icon] = true;
        }
        this.icons[icon] = true;
      })
    });

    let newIcons = Object.keys(newOnes);
    let newIconArray = [];
    newIcons.forEach((newIcon) => {
      if (newOnes[newIcon] === true) {
        newIconArray.push(newIcon)
      }
    });
    stateContent["offset"] = {};
    stateContent["circleSizeOffset"] = 20;

    this.props.categories.forEach((category) => {
      stateContent["offset"][category.key] = {};
      this.props.icons[category.key].forEach((iconName) => {
        stateContent["offset"][category.key][iconName] = {top: 0, left: 0}
      })
    })

    // console.log(JSON.stringify(newIconArray, undefined, 2));
    console.log("Amount of duplicate icons: ", Object.keys(this.duplicates).length, ':', JSON.stringify(Object.keys(this.duplicates), undefined, 2))

    this.state = stateContent;
  }

  _getIcons() {
    let items = [];
    this.props.categories.forEach((category) => {
      items.push(this._getCategory(category))
    });

    return items;
  }

  _getCategory(category) {
    let icons = this.props.icons[category.key];
    let heightWhenVisible =  Math.ceil(icons.length / AMOUNT_OF_ITEMS_IN_ROW) * (ROW_HEIGHT + 1);

    return (
      <View key={category.key}>
        <NavigationBar label={category.label} arrowDown={this.state[category.key]} callback={() => {
          let newState = {};
          newState[category.key] = !this.state[category.key];
          if (!this.state[category.key] == false) {
            this._generateOffsets()
          }
          this.setState(newState);
        }} />
        <Separator fullLength={true} />
        <SlideInView visible={this.state[category.key]} height={heightWhenVisible} duration={300}>
          {this._getIconRows(icons, this.state[category.key], category.key)}
        </SlideInView>
      </View>
    )
  }

  _getIconRows(icons, visible, categoryKey) {
    if (visible === true) {
      let rowCount = Math.ceil(icons.length / AMOUNT_OF_ITEMS_IN_ROW);
      let items = [];
      for (let i = 0; i < rowCount; i++) {
        items.push(this._getIconRow(icons, i * AMOUNT_OF_ITEMS_IN_ROW, 'iconRow_' + i, categoryKey))
      }
      return items;
    }
    return undefined;
  }

  _getIconRow(icons, iconIndex, key, categoryKey) {
    let items = [];
    for (let i = 0; i < AMOUNT_OF_ITEMS_IN_ROW; i++) {
      items.push(this._getIcon(   icons, iconIndex + i, categoryKey));
      if (i < AMOUNT_OF_ITEMS_IN_ROW - 1) {
        items.push(this._getBorder(icons, iconIndex + i))
      }
    }

    return (
      <View key={key}>
        <View style={{flexDirection:'row'}}>
          { items }
        </View>
        <View style={{height:1, backgroundColor: borderColor}} />
      </View>
    )
  }

  _getBorder(icons, iconIndex) {
    if (iconIndex < icons.length) {
      return (
        <View key={icons[iconIndex]+ "_border"} style={{width:1, backgroundColor: borderColor}} />
      )
    }
  }

  _getIcon(icons, iconIndex, categoryKey) {
    if (iconIndex < icons.length) {
      let backgroundColor = this.props.selectedIcon === icons[iconIndex] ? colors.blue.hex : "transparent";

      if (this.duplicates[icons[iconIndex]]) {
        backgroundColor = colors.red.hex;
      }

      if (!this.props.offsets[categoryKey][icons[iconIndex]]) {
        console.log("No offset for ", categoryKey, icons[iconIndex])
      }
      let topExistingOffset = this.props.offsets[categoryKey] && this.props.offsets[categoryKey][icons[iconIndex]] && this.props.offsets[categoryKey][icons[iconIndex]].top || 0;
      let topOffset = Number(this.state.offset[categoryKey][icons[iconIndex]].top);
      let topOffsetLabel = topExistingOffset + topOffset;
      let leftExistingOffset = this.props.offsets[categoryKey] && this.props.offsets[categoryKey][icons[iconIndex]] && this.props.offsets[categoryKey][icons[iconIndex]].left || 0;
      let leftOffset = Number(this.state.offset[categoryKey][icons[iconIndex]].left);
      let leftOffsetLabel = leftExistingOffset + leftOffset;
      let h = ICON_SIZE + 20;
      let small = ICON_SIZE / 2;
      let sh = small + this.state.circleSizeOffset;

      return (
        <View style={[styles.centered, {height:ROW_HEIGHT, flex:1}, {backgroundColor: backgroundColor} ]} key={icons[iconIndex]}>
          <View style={[styles.centered, {position:'absolute', top:5, left: 5, width: h, height:h}, {backgroundColor: colors.blue.rgba(1)} ]} />
          <View style={[styles.centered, {position:'absolute', top:5, left: 5, width: h, height:h, borderRadius: 0.5*h}, {backgroundColor: colors.red.rgba(1)} ]} />
          <View style={[styles.centered, {position:'absolute', top: 15, left: 15, width: ICON_SIZE, height:ICON_SIZE}, {backgroundColor: colors.purple.rgba(0.6)} ]} />
          <View style={[styles.centered, {position:'absolute', top:5, left: 5, width: h, height:h} ]}>
            <View style={{position:'relative', top: topOffset*ICON_SIZE, left: leftOffset*ICON_SIZE}}>
              <Icon name={icons[iconIndex]} size={ICON_SIZE} color={ colors.white.hex} />
            </View>
          </View>
          <View style={[styles.centered, {position:'absolute', top:5, left: 5 + 0.5*h - 1, width: 2, height:h},  {backgroundColor: colors.black.rgba(0.5)} ]} />
          <View style={[styles.centered, {position:'absolute', top:5 + 0.5*h - 1, left: 5, width: h, height: 2}, {backgroundColor: colors.black.rgba(0.5)} ]} />
          <TouchableOpacity style={{position:'absolute', top:5, left: 5 +0.25*h, width:0.5*h, height: 0.5*h}} onPress={() => {
            let offsetObj = this.state.offset;
            offsetObj[categoryKey][icons[iconIndex]].top = String(topOffset - 0.005);
            this.setState({offset: offsetObj})}}
          />
          <TouchableOpacity style={{position:'absolute', top: 0.5*h + 5, left: 5 +0.25*h, width:0.5*h, height: 0.5*h}} onPress={() => {
            let offsetObj = this.state.offset;
            offsetObj[categoryKey][icons[iconIndex]].top = String(topOffset + 0.005);
            this.setState({offset: offsetObj})}}
          />
          <TouchableOpacity style={{position:'absolute', top:5, left: 5, width:0.25*h, height: h}} onPress={() => {
            let offsetObj = this.state.offset;
            offsetObj[categoryKey][icons[iconIndex]].left = String(leftOffset - 0.005);
            this.setState({offset: offsetObj})
          }}
          />
          <TouchableOpacity style={{position:'absolute', top:5, left: 5+0.75*h, width:0.25*h, height: h}} onPress={() => {
            let offsetObj = this.state.offset;
            offsetObj[categoryKey][icons[iconIndex]].left = String(leftOffset + 0.005);
            this.setState({offset: offsetObj})
          }}
          />


          <View style={[styles.centered, {position:'absolute', top:10+h, left: 5, width: sh, height:sh, borderRadius: 0.5*sh}, {backgroundColor: colors.red.rgba(1)} ]} />
          <TouchableOpacity
            style={[styles.centered, {position:'absolute', top:10+h, left: 5, width: sh, height:sh} ]}
            onPress={() => {
              let values = [ -15, -10, -5, 0, 2, 5, 10, 15, 20];
              let newValue = values[(values.indexOf(this.state.circleSizeOffset) + 1)%values.length]
              this.setState({circleSizeOffset: newValue})
            }}
          >
            <View style={{position:'relative', top: topOffset*small*0.9, left: leftOffset*small*0.9}}>
              <Icon name={icons[iconIndex]} size={small*0.9} color={ colors.white.hex} />
            </View>
          </TouchableOpacity>

          <Text style={{position:'absolute', top: h + sh + 10, fontSize:14, color: colors.white.hex}}>{icons[iconIndex] + " o:" + topOffsetLabel.toFixed(3) + ',' +  + leftOffsetLabel.toFixed(3)}</Text>
        </View>
      );
    }
    else {
      return (
        <View key={"Empty" + iconIndex} style={{flex:1}} />
      );
    }
  }

  _generateOffsets() {
    let nameLength = 35;
    this.props.categories.forEach((category) => {
      let str = "const " + category.key + "Corrections = {\n"
      this.props.icons[category.key].forEach((iconName) => {
        let lineStr = "  '" + iconName + "':";
        for (let i =  lineStr.length; i < nameLength; i++) {
          lineStr += ' '
        }
        let topExistingOffset = this.props.offsets[category.key] && this.props.offsets[category.key][iconName] && this.props.offsets[category.key][iconName].top || 0;
        let topOffset = Number(this.state.offset[category.key][iconName].top);
        let topOffsetLabel = topExistingOffset + topOffset;
        
        let leftExistingOffset = this.props.offsets[category.key] && this.props.offsets[category.key][iconName] && this.props.offsets[category.key][iconName].left || 0;
        let leftOffset = Number(this.state.offset[category.key][iconName].left);
        let leftOffsetLabel = leftExistingOffset + leftOffset;
        
        lineStr += "{change: true, top: " + (topOffsetLabel < 0 ? '' : '+') + topOffsetLabel.toFixed(3) + ', left: ' + (leftOffsetLabel < 0 ? '' : '+') + leftOffsetLabel.toFixed(3) + '},\n';
        str += lineStr
      })
      str += '}\n\n'
      console.log(str)
    })
  }

  render() {
    return (
      <View style={{flexDirection:'column', backgroundColor:"rgba(255,255,255,0.5)"}}>
        <View style={{height:1, backgroundColor: borderColor}} />
        {this._getIcons()}
      </View>
    );
  }
}
