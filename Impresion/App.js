import Amplify from 'aws-amplify';
import { ConfirmSignIn, ConfirmSignUp, ForgotPassword, SignIn, SignUp, VerifyContact, withAuthenticator } from 'aws-amplify-react-native';
import React, { Component } from 'react';
import { AppRegistry,  } from 'react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import config from './src/aws_cognito/aws_config';
import Navigation from './src/containers/Navigation';
import reducer from './src/reducers/stores';
import { Root  } from "native-base";

Amplify.configure({
  Auth:{
      mandatorySignIn:false,
      region: config.cognito.REGION,
      userPoolId: config.cognito.USER_POOL_ID,
      identityPoolId: config.cognito.IDENTITY_POOL_ID,
      userPoolWebClientId: config.cognito.APP_CLIENT_ID,
  }
})

const store = createStore(
  reducer,
  {},
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
)

class App extends Component {
  render() {
  	return (
      <Provider store={store}>
        <Root>
          <Navigation />
          </Root>
      </Provider>
    );
  }
}

AppRegistry.registerComponent('App', () => App);

export default App;