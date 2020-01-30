import { Form, Icon, Input, Item, Picker, Text, Toast } from 'native-base';
import React, { Component } from 'react';
import { AsyncStorage, Modal, Platform, ScrollView, StyleSheet, TouchableHighlight, View } from 'react-native';
import NetInfo from "@react-native-community/netinfo";
import { Consultar as ConsultarClientes } from '../../api/apiClientes';
import { Consultar as ConsultarListaPrecios } from '../../api/apiListaPrecios';
import { Consultar as ConsultarProductos, ConsultarProductosListaPrecios } from '../../api/apiProductos';
import { ConsultarResolucion, GuardarTransaccion } from '../../api/apiUtils';
import colors from '../../styles/colors';
import Loader from '../Loader';


const claveAdmin = "vysor2019*";

export default class SincronizacionComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: false,
      fechaSincronizado: '',
      modalPuntoVentaVisible: false,
      puntoVentaSeleccionado: '',
      botonAgregarDisable: true,
      pendientes:0
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleOpenPuntoVenta = this.handleOpenPuntoVenta.bind(this);
    this.handlePuntoVentaChange = this.handlePuntoVentaChange.bind(this);
  }

  componentDidMount(){
    this.handleClickRefrescar();
  }

  handlePuntoVentaChange(value) {
    this.setState({ puntoVentaSeleccionado: value });
  }

  handleClickGuardar = async () => {
    let nombre = "codigoPOS";
    const { puntoVentaSeleccionado } = this.state;
    await AsyncStorage.removeItem(nombre);
    await AsyncStorage.setItem(nombre, puntoVentaSeleccionado);
    this.setState({ modalPuntoVentaVisible: false, modalVisible: true }, () => {
      ConsultarResolucion(puntoVentaSeleccionado).then(result => {
        if (result.status === 200) {
          this.AdministrarStorage(result.data, "resolucionFacturacion");
        } else {
          this.setState({ modalVisible: false, }, () => {
            this.Notificacion('No fue posible sincronizar resolución de facturación', 'danger');
          });
        }
      });
    });
  }

  handleClosePuntoVenta = () => {
    this.setState({ modalPuntoVentaVisible: false });
  }

  handleOpenPuntoVenta = () => {
    this.setState({ modalPuntoVentaVisible: true });
  }

  handleChangeClave = (value) => {
    if (claveAdmin == value.toLowerCase()) {
      this.setState({ botonAgregarDisable: false })
    } else {
      this.setState({ botonAgregarDisable: true })
    }
  }

  handleClick = async boton => {

    this.ValidarInternet().then(async (result) => {
      if (result) {
        this.Notificacion(`Sincronizando ${boton}`, 'success');
        switch (boton) {
          case 'transacciones':
              let transacciones = await JSON.parse(await AsyncStorage.getItem("transacciones"));
              if(transacciones == null)return;
              if(transacciones.length == 0)return;
              this.setState({ modalVisible: true }, () => {
              GuardarTransaccion(transacciones).then(result => {
                if (result.status === 200) {
                  this.setState({ modalVisible: false, }, async () => {

                    let transaccionesOK = [];
                    await result.data.map(result => {
                      if (result.estado == 4 || result.estado == 7) {
                        transaccionesOK.push(result.idTransaction)
                      }
                    })

                    if (transaccionesOK.length == 0) {
                      return;
                    }

                    let newTransacciones = await transacciones;
                    await transaccionesOK.map((idTransaccion) => {
                      transacciones.map((item) => {
                        if (item.idTransacciones == idTransaccion) {
                          newTransacciones = newTransacciones.filter((item)=> item.idTransacciones != idTransaccion);
                        }
                      })
                    })

                    await this.AdministrarStorage(newTransacciones, "transacciones")
                    await this.handleClickRefrescar();

                  })
                } else {
                  this.setState({ modalVisible: false, }, async () => {
                    this.Notificacion('No fue posible sincronizar', 'danger');
                  });
                }
              });
            });
            break;
          case 'productos':
            this.setState({ modalVisible: true }, () => {
              ConsultarProductos().then(result => {
                if (result.status === 200) {
                  this.AdministrarStorage(result.data, boton);
                } else {
                  this.setState({ modalVisible: false, }, () => {
                    this.Notificacion('No fue posible sincronizar los productos', 'danger');
                  });
                }
              });
            })
            break;
          case 'clientes':
            this.setState({ modalVisible: true }, () => {
              ConsultarClientes().then(result => {
                if (result.status === 200) {
                  this.AdministrarStorage(result.data, boton);
                } else {
                  this.setState({ modalVisible: false, }, () => {
                    this.Notificacion('No fue posible sincronizar los clientes', 'danger');
                  });
                }
              });
            })
            break;
          // case 'listaPrecios':
          //   this.setState({ modalVisible: true }, () => {
          //     ConsultarListaPrecios().then(result => {
          //       if (result.status === 200) {
          //         this.AdministrarStorage(result.data, boton);
          //       } else {
          //         this.setState({ modalVisible: false, }, () => {
          //           this.Notificacion('No fue posible sincronizar la lista de precios', 'danger');
          //         });
          //       }
          //     });
          //   })
          //   break;
          case 'listaPreciosxProducto':
            this.setState({ modalVisible: true }, () => {
              ConsultarProductosListaPrecios().then(result => {
                if (result.status === 200) {
                  this.AdministrarStorage(result.data, boton);
                } else {
                  this.setState({ modalVisible: false, }, () => {
                    this.Notificacion('No fue posible sincronizar listaPreciosxProducto', 'danger');
                  });
                }
              });
            })
            break;
          case 'resolucionFacturacion':
            this.setState({ modalVisible: true }, async () => {
              let codigoPOS = await AsyncStorage.getItem("codigoPOS");
              if (codigoPOS === null) {
                this.setState({ modalVisible: false, }, () => {
                  this.Notificacion('Debe indicar el código de este dispositivo', 'danger');
                });
                return;
              }

              ConsultarResolucion(codigoPOS).then(result => {
                if (result.status === 200) {
                  this.AdministrarStorage(result.data, boton);
                } else {
                  this.setState({ modalVisible: false, }, () => {
                    this.Notificacion('No fue posible sincronizar resolución de facturación', 'danger');
                  });
                }
              });
            })
            break;
          case 'bodegas':

            break;
          case 'motivos':

            break;
          case 'proveedores':

            break;
          case 'tiposDocumentos':

            break;
          default:

            break;
        }
      } else {
        this.setState({ modalVisible: false }, () => {
          this.Notificacion('Sin internet. Imposible sincronizar', 'danger');
        });
      }
    })
  }

  ValidarInternet = async () => {
    let result = false;
    if (Platform.OS === "android") {
      await NetInfo.isConnected.fetch().then(isConnected => {
        if (isConnected) {
          result = true;
        }
      });
    } else {
      result = true;
    }
    return result;
  }

  AdministrarStorage = async (data, boton) => {
    await AsyncStorage.removeItem(boton)
    await AsyncStorage.setItem(boton, JSON.stringify(data));
    this.setState({ modalVisible: false }, () => {
      this.Notificacion(`¡${boton} sincronizados!`, 'success');
    });
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

  handleClickRefrescar = async () =>{
    let transacciones = await JSON.parse(await AsyncStorage.getItem("transacciones"));
    this.setState({pendientes:0});
    if(transacciones == null)return;
    if(transacciones.length == 0)return;
    this.setState({
      pendientes: transacciones.length
    })
  }

  render() {
    const { modalVisible, modalPuntoVentaVisible, puntoVentaSeleccionado, botonAgregarDisable, pendientes } = this.state;
    return (
      <View>
        <Loader animationType='fade' modalVisible={modalVisible} />
        <ScrollView style={styles.scrollView}>
          <Text style={styles.heading}>
            Sincronizar datos
        </Text>
        <View>
          <TouchableHighlight onPress={this.handleClickRefrescar} style={styles.refrescarButton}>
                <Text style={styles.refrescarButtonText}>
                  REFRESCAR DATOS
          </Text>
              </TouchableHighlight>
          </View>
          <TouchableHighlight onPress={() => this.handleClick('transacciones')} style={styles.findHomesButton}>
            <Text style={styles.findHomesButtonText}>
              TRANSACCIONES
          </Text>
          </TouchableHighlight>
          <Text style={styles.description}>
            {pendientes} transacciones pendientes
        </Text>
          <TouchableHighlight onPress={() => this.handleClick('productos')} style={styles.findHomesButton}>
            <Text style={styles.findHomesButtonText}>
              PRODUCTOS
          </Text>
          </TouchableHighlight>
          <TouchableHighlight onPress={() => this.handleClick('clientes')} style={styles.findHomesButton}>
            <Text style={styles.findHomesButtonText}>
              CLIENTES
          </Text>
          </TouchableHighlight>
          <TouchableHighlight onPress={() => this.handleClick('listaPrecios')} style={styles.findHomesButton}>
            <Text style={styles.findHomesButtonText}>
              LISTAS DE PRECIOS
          </Text>
          </TouchableHighlight>
          <TouchableHighlight onPress={() => this.handleClick('listaPreciosxProducto')} style={styles.findHomesButton}>
            <Text style={styles.findHomesButtonText}>
              PRODUCTOS LISTA DE PRECIOS
          </Text>
          </TouchableHighlight>
          <TouchableHighlight onPress={() => this.handleClick('resolucionFacturacion')} style={styles.findHomesButton}>
            <Text style={styles.findHomesButtonText}>
              RESOLUCION FACTURACIÓN
          </Text>
          </TouchableHighlight>
          <TouchableHighlight onPress={this.handleOpenPuntoVenta} style={styles.findHomesButton}>
            <Text style={styles.findHomesButtonText}>
              DEFINIR PUNTO DE VENTA
          </Text>
          </TouchableHighlight>
          <View style={{ display: 'none' }}>
            <TouchableHighlight disabled={true} onPress={() => this.handleClick('bodegas')} style={styles.findHomesButton}>
              <Text style={styles.findHomesButtonText}>
                BODEGAS
          </Text>
            </TouchableHighlight>
            <TouchableHighlight disabled={true} onPress={() => this.handleClick('motivos')} style={styles.findHomesButton}>
              <Text style={styles.findHomesButtonText}>
                MOTIVOS
          </Text>
            </TouchableHighlight>
            <TouchableHighlight disabled={true} onPress={() => this.handleClick('proveedores')} style={styles.findHomesButton}>
              <Text style={styles.findHomesButtonText}>
                PROVEEDORES
          </Text>
            </TouchableHighlight>
            <TouchableHighlight disabled={true} onPress={() => this.handleClick('tiposDocumentos')} style={styles.findHomesButton}>
              <Text style={styles.findHomesButtonText}>
                TIPOS DE DOCUMENTO
          </Text>
            </TouchableHighlight>

          </View>
        </ScrollView>

        <View >
          <Modal
            animationType="slide"
            transparent={false}
            visible={modalPuntoVentaVisible}
            onRequestClose={() => {
              this.handleClosePuntoVenta
            }}>
            <View style={{ marginTop: 22 }}>
              <View>
                <Text style={styles.subtitle}>
                  Seleccione un código de punto de venta:
          </Text>
                <Form>
                  <Item picker>
                    <Picker
                      mode="dropdown"
                      iosIcon={<Icon name="arrow-down" />}
                      style={{ width: undefined }}
                      placeholder="Seleccione un punto de venta"
                      placeholderStyle={{ color: "#bfc6ea" }}
                      placeholderIconColor="#007aff"
                      selectedValue={puntoVentaSeleccionado}
                      onValueChange={this.handlePuntoVentaChange}
                    >
                      {puntosVenta.map((item, i) => (
                        <Picker.Item key={i} label={item} value={item} />
                      ))
                      }

                    </Picker>
                  </Item>

                  <Item regular>
                    <Input placeholder='Ingrese clave de administrador' secureTextEntry={true} onChangeText={(text) => this.handleChangeClave(text)} />
                  </Item>

                </Form>
              </View>
              <View style={!botonAgregarDisable ? null : { display: 'none' }} >
                <TouchableHighlight onPress={this.handleClickGuardar} style={styles.findHomesButton}>
                  <Text style={styles.findHomesButtonText}>
                    GUARDAR
          </Text>
                </TouchableHighlight>
              </View>
              <TouchableHighlight onPress={this.handleClosePuntoVenta} style={styles.findHomesButton}>
                <Text style={styles.findHomesButtonText}>
                  CERRAR
          </Text>
              </TouchableHighlight>
            </View>
          </Modal>

        </View>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  scrollView: {
    height: '100%',
  },
  heading: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 0,
    color: colors.gray04,
    marginTop: 0,
    paddingLeft: 20,
    paddingRight: 20,
  },
  refrescar: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 15,
    color: colors.gray04,
    marginTop: 5,
    paddingLeft: 20,
    paddingRight: 20,
  },
  description: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.gray04,
    paddingLeft: 20,
    paddingRight: 20,
  },
  footer: {
    position: 'absolute',
    width: '100%',
    height: 80,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: colors.gray05,
    paddingLeft: 20,
    paddingRight: 20,
  },
  findHomesButton: {
    paddingTop: 15,
    paddingBottom: 15,
    marginTop: 5,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },
  findHomesButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
    color: colors.gray04,
    marginTop: 2,
    paddingLeft: 10,
    paddingRight: 20,
  },
  refrescarButton: {
    paddingTop: 0,
    paddingBottom: 10,
    marginTop: 0,
    borderRadius: 3,
    backgroundColor: colors.white,
    borderColor: colors.blue
  },
  refrescarButtonText: {
    fontSize:12,
    color: colors.blue,
    textAlign: 'center',
    fontWeight: '400',
  },
});

const puntosVenta = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10'
]