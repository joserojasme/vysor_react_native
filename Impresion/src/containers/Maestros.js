import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import {WebView} from 'react-native-webview'


export default class Maestros extends Component {
  
  render() {
    return (

        <WebView
        source={{uri: 'http://vysorshop.s3-website.us-east-2.amazonaws.com/home'}}
      />
      
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    display: 'flex',
    padding: 50,
  },
});
