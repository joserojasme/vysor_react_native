import React, { Component } from 'react';
import { Container, Header, Content, Form, Item, Input, Label, Button, Text, Toast } from 'native-base';
import { View, StyleSheet, Image, AsyncStorage, ActivityIndicator } from 'react-native';
import { SignIn, GetUserData } from '../../aws_cognito/amplifyAuth';

export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            indicator: false
        }
        this.validarSesion();
    }


    validarSesion = async () => {
        const userToken = await AsyncStorage.getItem('userToken');

        this.props.navigation.navigate(userToken ? 'Navigation' : 'Navigation');

    }

    handleChange = (event) => {
        let value = event.target.value;
        if (event.target.id == 'username') {
            value = value.toUpperCase();
            this.setState({ usernameCodigoVerificacion: value });
        }

        this.setState({
            [event.target.id]: value
        })
    }

    handleChangeUsuario = async (value) => {
        this.setState({ username: value });
    }

    handleChangePassword = async (value) => {
        this.setState({ password: value });
    }

    Notificacion = async (mensaje, type) => {
        await Toast.show({
            text: mensaje,
            position: "top",
            buttonText: "Ok",
            type: type,
            duration: 4000,
        })
    }

    handleLogin = async () => {
        
        let {username, password} = this.state;
        if(username == ''){
            this.Notificacion('Ingrese usuario y contraseña', 'danger');
            return;
        }

        if(password == ''){
            this.Notificacion('Ingrese usuario y contraseña', 'danger');
            return;
        }

        this.setState({indicator:true, username: username.toUpperCase()},()=>{
            SignIn({ ...this.state }).then((result) => {
                
                this.validarRespuestaSignIn(result)
            })
        })
    }

    validarRespuestaSignIn = (result) => {
        if (result == 'SUCCESS') {
            GetUserData().then(result => {
                
                this.setState({indicator:false},()=>{
                    this.props.navigation.navigate('Navigation');
                })
            })
        }else{
            this.setState({indicator:false},()=>{
                switch (result) {
                    case 'UserNotConfirmedException':
                        this.Notificacion('Usuario no confirmado', 'danger');
                        break;
                    case 'PasswordResetRequiredException':
                        //Que hacer en caso de que cognito resetee la contraseña dle usuario y deba cambiarse
                        break;
                    case 'NotAuthorizedException':
                        this.Notificacion('Usuario no autorizado', 'danger');
                        break;
                    case 'UserNotFoundException':
                        this.Notificacion('Usuario o contraseña incorrectos', 'danger');
                        break;
                    default:
                        this.Notificacion('Error desconocido' + result, 'danger');
                        break;
                }
            })
        }

        

        
    }

    render() {
        const { username, password, indicator } = this.state;
        return (
            <Container >
                <View style={styles.container}><Image source={require('../../img/icon.png')} style={styles.logo} /></View>
                <Content>
                    <Form>
                        <Item stackedLabel>
                            <Label>Usuario</Label>
                            <Input value={username} onChangeText={this.handleChangeUsuario} />
                        </Item>
                        <Item stackedLabel>
                            <Label>Contraseña</Label>
                            <Input secureTextEntry={true} value={password} onChangeText={this.handleChangePassword} />
                        </Item>
                        <Button onPress={this.handleLogin} style={{ backgroundColor: '#128BCC' }} block>
                            <Text>Iniciar sesión</Text>
                        </Button>
                        <Text>{username}</Text>
                        <Text>{password}</Text>
                        <Text>aa{indicator}</Text>
                        
                        <ActivityIndicator animating={indicator} />
                    </Form>
                </Content>
            </Container>
        );
    }
}

var styles = StyleSheet.create({

    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 150,
        height: 150,
    },



});