import PropTypes from 'prop-types';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import Impresion from '../components/impresion';
import Login from '../components/login/Login';
import Facturas from './Facturas';
import Home from './Home';
import Maestros from './Maestros';
import Sincronizacion from './Sincronizacion';

const CustomTabBarIcon = (name, size) => {
  const icon = ({ tintColor }) => (
    <Icon
      name={name}
      size={size}
      color={tintColor}
    />
  );

  icon.propTypes = {
    tintColor: PropTypes.string.isRequired,
  };

  return icon;
};

const TabNavigator = createBottomTabNavigator({
  Home: {
    screen: Home,
    navigationOptions: {
      tabBarLabel: 'HOME',
      tabBarIcon: CustomTabBarIcon('ios-home', 22),
      
    },
  },
  Sincronizacion: {
    screen: Sincronizacion,
    navigationOptions: {
      tabBarLabel: 'SINCRONIZAR',
      tabBarIcon: CustomTabBarIcon('ios-sync', 22),
    },
  },
  Facturas: {
    screen: Facturas,
    navigationOptions: {
      tabBarLabel: 'FACTURAR',
      tabBarIcon: CustomTabBarIcon('ios-list-box', 22),
      tabBarOptions: {
        activeTintColor: '#e91e63',
        labelStyle: {
          fontSize: 12,
        },
      },
    },
  },
  Maestros: {
    screen: Maestros,
    navigationOptions: {
      tabBarLabel: 'MAESTROS',
      tabBarIcon: CustomTabBarIcon('ios-pricetags', 22),
    },
  },
  // Bodegas: {
  //   screen: Bodegas,
  //   navigationOptions: {
  //     tabBarLabel: 'BODEGAS',
  //     tabBarIcon: CustomTabBarIcon('ios-archive', 22),
  //   },
  // },
  Impresora: {
    screen: Impresion,
    navigationOptions: {
      tabBarLabel: 'IMPRESORA',
      tabBarIcon: CustomTabBarIcon('ios-print', 22),
    },
  },
  //Login:Login
});



export default createAppContainer(createSwitchNavigator({
  Login: Login,
  Navigation: TabNavigator
}));