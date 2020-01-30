import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AsyncStorage
} from 'react-native';
import FacturasComponent from '../components/facturas/FacturasComponent';
import colors from '../styles/colors';

export default class Facturas extends Component {

  render() {
    return (
      <View style={styles.wrapper}>
        <FacturasComponent />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    display: 'flex',
    backgroundColor: colors.white,
  },
});
