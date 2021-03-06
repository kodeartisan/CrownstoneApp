import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


import { Background } from './../components/Background'
import {colors, OrangeLine} from './../styles'
import {screenWidth, topBarHeight} from "../styles";
import {ScaledImage} from "../components/ScaledImage";
import {IconButton} from "../components/IconButton";
import {MeshElement} from "../components/MeshElement";


export class SettingsMeshTopologyHelp extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: "Mesh Help" }
  };

  constructor(props) {
    super(props);
  }


  render() {
    let explanationStyle = {fontSize:15, padding: 20, paddingTop:30, textAlign:'center'};
    let headerStyle = {...explanationStyle, fontSize:18, fontWeight:'bold'};
    let titleStyle = {...explanationStyle, fontSize:30, fontWeight:'bold'};

    let mockData = {deviceIcon: 'c1-studiolight', locationIcon: 'c1-cinema', locationTitle: 'Movie Room', element:{config:{name:'Device'}}, stone:{config:{name:'Device', firmwareVersion: '2.3.0'}}};
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.menu}>
        <OrangeLine/>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:10}} />
            <Text style={titleStyle}>{"Mesh Topology"}</Text>
            <View style={{height:20}} />
            <IconButton name="md-share" buttonSize={80} size={60} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />
            <View style={{height:10}} />
            <Text style={explanationStyle}>{
              "Crownstones can talk to each other, and a group of Crownstones chatting makes up a mesh network." +
              "\n\nThey can only talk to each other if they are in range of each other. The topology view shows you which Crownstones can talk to each other." +
              "\n\nThe icons show the Crownstone with its device icon as shown here:"
            }</Text>
            <View style={{ width:screenWidth, height:120, alignItems:'center', justifyContent:'center'}}>
              <MeshElement key={"explanation1"} id={1} nodeData={mockData} pos={[0,0]} radius={50} />
            </View>
            <Text style={explanationStyle}>{
              "Every other second the Crownstones will advertise the state of other Crownstones, as well as how well they can hear them. " +
              "This information is gathered by your phone when the app is open (on the foreground)." +
              "\n\nIf your phone can hear this information from a Crownstone, the border of the circle will become green:"
            }</Text>
            <View style={{width:screenWidth, height:120, alignItems:'center', justifyContent:'center'}}>
              <MeshElement __reachableOverride={true} key={"explanation2"} id={1} nodeData={mockData} pos={[0,0]} radius={50} />
            </View>
            <Text style={explanationStyle}>{
              "Every second, the background will blink green to show you you're still in range of that Crownstone." +
              "\n\nIf you tap on the bubble, it will expand to show you its name and the room that it's currently in:"
            }</Text>
            <View style={{width:280, height:135, alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              <MeshElement __expandOverride={true} key={"explanation2"} id={1} nodeData={mockData} pos={{x:60, y:20}} radius={30} />
            </View>
            <Text style={explanationStyle}>{
              "The connectivity among Crownstones can only be heard directly. If there are unconnected Crownstones in the overview and " +
              "you want to check how well they are connected to rest of the network, you'll have to be in range of that Crownstone to check." +
              "\n\nAs an alternative, you can press the 'Networks' button in the top right to see which Crownstones are in which network." +
              "\n\nThese networks will be cleared and rediscovered every time you reopen the app as an ensurance that the mesh networks are always up te date."
            }</Text>

            <Text style={headerStyle}>{"Enjoy the Mesh!"}</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}