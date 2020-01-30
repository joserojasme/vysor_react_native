import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AsyncStorage,
} from 'react-native';
import SincronizacionComponent from '../components/sincronizacion/SincronizacionComponent';
import colors from '../styles/colors';

class Sincronizacion extends Component {
  // componentDidMount() {
  //   this.validarSesion();
  // }

  // validarSesion = async () => {
  //   const userToken = await AsyncStorage.getItem('userToken');
  //   console.log(userToken)
  //   if(userToken){
  //     this.props.navigation.navigate('Login');
  //   }
  // };

  render() {
    return (
      <View style={styles.wrapper}>
        <SincronizacionComponent />
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

export default Sincronizacion;
