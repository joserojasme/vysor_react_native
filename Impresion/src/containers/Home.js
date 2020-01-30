import NetInfo from "@react-native-community/netinfo";
import { Text, Toast } from 'native-base';
import React, { Component } from 'react';
import { AsyncStorage, Platform, ScrollView, StyleSheet, TouchableHighlight, View } from 'react-native';
import { DataTable } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import { Consultar as ConsultarClientes } from '../api/apiClientes';
import { Consultar as ConsultarListaPrecios } from '../api/apiListaPrecios';
import { Consultar as ConsultarProductos, ConsultarProductosListaPrecios } from '../api/apiProductos';
import { ConsultarResolucion } from '../api/apiUtils';
import Loader from '../components/Loader';
import colors from '../styles/colors';
import { Imprimir, numberFormat } from '../utils/funcionesUtiles';

function ccyFormat(num) {
  num = parseFloat(num);
  let value = `${num.toFixed(2)}`;
  return numberFormat(value);
}

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      favouriteListings: [],
      modalVisible: false,
      sincronizado: true,
      fechaSincronizado: '',
      transaccionesResumen: [],
      valorTotalDia: 0,
      valorTotalDiaDebito: 0,
      valorTotalDiaCredito: 0,
      clientes: [],
    };
    //this.renderListings = this.renderListings.bind(this);
    this.getNombreCliente = this.getNombreCliente.bind(this);
    this.handleChangeDay = this.handleChangeDay.bind(this);
    this.Imprimir = this.Imprimir.bind(this);
  }

  handleChangeDay = () => {

  }

  componentWillMount() {
    this.consultarVentasStorage();
    this.ValidarInternet().then(resultInternet => {
      if (resultInternet) {
        this.ValidarSincronizado().then(async (result) => {
          if (result) {
            this.Notificacion('Sincronizando datos...', 'success');

            //Sincronización de productos
            this.setState({ modalVisible: true }, () => {
              ConsultarProductos().then(result => {
                if (result.status === 200) {
                  this.AdministrarStorage(result.data, "productos");
                } else {
                  this.setState({ modalVisible: false, sincronizado: false }, () => {
                    this.Notificacion('Productos no sincronizados', 'danger');
                  });
                }
              });
            })

            //Sincronización de clientes
            this.setState({ modalVisible: true }, () => {
              ConsultarClientes().then(result => {
                if (result.status === 200) {
                  this.AdministrarStorage(result.data, "clientes");
                  this.setState({ clientes: result.data })
                } else {
                  this.setState({ modalVisible: false, sincronizado: false }, () => {
                    this.Notificacion('Clientes no sincronizados', 'danger');
                  });
                }
              });
            })

            // //Sincronización de Listas de precios
            // this.setState({ modalVisible: true }, () => {
            //   ConsultarListaPrecios().then(result => {
            //     if (result.status === 200) {
            //       this.AdministrarStorage(result.data, "listaPrecios");
            //     } else {
            //       this.setState({ modalVisible: false, sincronizado: false }, () => {
            //         this.Notificacion('Lista de precios no sincronizados', 'danger');
            //       });
            //     }
            //   });
            // })

            //Sincronización de listas de precios por productos
            this.setState({ modalVisible: true }, () => {
              ConsultarProductosListaPrecios().then(result => {
                if (result.status === 200) {
                  this.AdministrarStorage(result.data, "listaPreciosxProducto");
                } else {
                  this.setState({ modalVisible: false, sincronizado: false }, () => {
                    this.Notificacion('Listas de preciosxproducto no sincronizada', 'danger');
                  });
                }
              });
            })

            //Sincronización rango resolución
            this.setState({ modalVisible: true }, async () => {
              let codigoPOS = await AsyncStorage.getItem("codigoPOS");
              if (codigoPOS === null) return;
              ConsultarResolucion(codigoPOS).then(result => {
                if (result.status === 200) {
                  this.AdministrarStorage(result.data, "resolucionFacturacion");
                } else {
                  this.setState({ modalVisible: false, sincronizado: false }, () => {
                    this.Notificacion('Resoluciones no sincronizadas', 'danger');
                  });
                }
              });
            })

            this.FechaSincronizado();
          } else {
            let clientes = await JSON.parse(await AsyncStorage.getItem("clientes"));
            if (clientes != null) {
              this.setState({ clientes: clientes })
            }
          }
        })
      } else {
        this.setState({ modalVisible: false }, () => {
          this.Notificacion('Sin internet. Imposible sincronizar', 'danger');
        });
      }
    })
  }

  FechaSincronizado = async () => {
    let fecha = new Date();
    let ano = fecha.getFullYear();
    let mes = fecha.getMonth() + 1;
    let dia = fecha.getDate();
    let hora = fecha.getHours();
    let minutos = fecha.getMinutes();
    let segundos = fecha.getSeconds();

    let fechaSincronizado = await `${ano}-${mes.toString().length == 1 ? '0' + mes : mes}-${dia.toString().length == 1 ? '0' + dia : dia} ${hora.toString().length == 1 ? '0' + hora : hora}:${minutos.toString().length == 1 ? '0' + minutos : minutos}:${segundos.toString().length == 1 ? '0' + segundos : segundos}`
    this.setState({ fechaSincronizado: fechaSincronizado });
    await AsyncStorage.removeItem('fechaSincronizado');
    await AsyncStorage.setItem('fechaSincronizado', fechaSincronizado.substring(0, 10));
  }

  ValidarSincronizado = async () => {
    let fecha = new Date();
    let ano = fecha.getFullYear();
    let mes = fecha.getMonth() + 1;
    let dia = fecha.getDate();

    //await AsyncStorage.removeItem('fechaSincronizado');
    let fechaActual = await `${ano}-${mes.toString().length == 1 ? '0' + mes : mes}-${dia.toString().length == 1 ? '0' + dia : dia}`
    let fechaSincronizado = await AsyncStorage.getItem('fechaSincronizado');
    if (fechaSincronizado != fechaActual) {
      return true;
    } else {
      return false;
    }
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

  consultarVentasStorage = async () => {
    let clientes = await JSON.parse(await AsyncStorage.getItem("clientes"));
    if (clientes != null) {
      this.setState({ clientes: clientes })
    }
    let transaccionesResumen = await JSON.parse(await AsyncStorage.getItem("transaccionesResumen"));

    if (transaccionesResumen == null) {
      transaccionesResumen = [];
      this.setState({ transaccionesResumen: transaccionesResumen })
    } else {
      let data = await transaccionesResumen.map(item => {
        return JSON.parse(item.data)
      })

      let valorTotalDia = 0;
      let valorTotalDiaDebito = 0;
      let valorTotalDiaCredito = 0;
      let fecha = new Date();
      let ano = fecha.getFullYear();
      let mes = fecha.getMonth() + 1;
      let dia = fecha.getDate();
      let fechaActual = `${ano}-${mes.toString().length == 1 ? '0' + mes : mes}-${dia.toString().length == 1 ? '0' + dia : dia}`;

      let DataDia = await data.filter(item => {
        return item.fecha.substring(0, 10) == fechaActual
      })

      await DataDia.map(item => {
        valorTotalDia += item.totalNeto;
        if (item.tipoPago === 1) {
          valorTotalDiaCredito += item.totalNeto
        }
        if (item.tipoPago === 0) {
          valorTotalDiaDebito += item.totalNeto
        }
      })

      this.setState({
        transaccionesResumen: DataDia
        , valorTotalDia: valorTotalDia
        , valorTotalDiaDebito: valorTotalDiaDebito
        , valorTotalDiaCredito: valorTotalDiaCredito
      })
    }
  }

  getCliente = (idCliente) => {
    const { clientes } = this.state;
    let nombreCliente = {};
    if (clientes.length > 0) {
      clientes.map((item) => {
        if (item.id == idCliente) {
          nombreCliente = item;
        }
      })
    }

    return nombreCliente;
  }

  getNombreCliente = (idCliente) => {
    const { clientes } = this.state;
    let nombreCliente = '';
    if (clientes.length > 0) {
      clientes.map((item) => {
        if (item.id == idCliente) {
          nombreCliente = item.nombre;
        }
      })
    }

    return `${nombreCliente}`;
  }

  AdministrarStorage = async (data, clave) => {
    await AsyncStorage.removeItem(clave)
    await AsyncStorage.setItem(clave, JSON.stringify(data));
    this.setState({ modalVisible: false }, () => {
      this.Notificacion(`¡${clave} sincronizados!`, 'success');
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

  handleClickRefrescar = async () => {
    this.consultarVentasStorage();
  }

  Imprimir = (dataTransaccion) => {
    dataTransaccion = JSON.parse(dataTransaccion);
    let cliente = this.getCliente(dataTransaccion.cliente);
    Imprimir(dataTransaccion, cliente, true);
  }

  render() {
    const { modalVisible, sincronizado, fechaSincronizado, transaccionesResumen, valorTotalDia, valorTotalDiaDebito, valorTotalDiaCredito} = this.state;

    return (
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.scrollview}
          contentContainerStyle={styles.scrollViewContent}
        >
          <Loader animationType='fade' modalVisible={modalVisible} />

          <Text style={sincronizado ? styles.headingSincronizacion : styles.headingSinSincronizacion}>
            {sincronizado ? `Sincronizado ${fechaSincronizado}` : 'Sin sincronizar'}
          </Text>

          <View>
            <TouchableHighlight onPress={this.handleClickRefrescar} style={styles.refrescarButton}>
              <Text style={styles.refrescarButtonText}>
                REFRESCAR DATOS
          </Text>
            </TouchableHighlight>
          </View>

          <View style={styles.centrado}>
            <DataTable >
              <DataTable.Header>
                <DataTable.Title numeric>TotalCreditos</DataTable.Title>
                <DataTable.Title numeric>TotalDebitos</DataTable.Title>
                <DataTable.Title numeric>TotalVentas</DataTable.Title>
              </DataTable.Header>

              <DataTable.Row>
                <DataTable.Cell numeric><Text style={styles.itemsLista}>$ {ccyFormat(valorTotalDiaCredito)}</Text></DataTable.Cell>
                <DataTable.Cell numeric><Text style={styles.itemsLista}>$ {ccyFormat(valorTotalDiaDebito)}</Text></DataTable.Cell>
                <DataTable.Cell numeric><Text style={styles.itemsLista}>$ {ccyFormat(valorTotalDia)}</Text></DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          </View>

          <View >
            <DataTable >
              <DataTable.Header>
                <DataTable.Title>Reimprimir</DataTable.Title>
                <DataTable.Title>Cliente</DataTable.Title>
                <DataTable.Title numeric>Valor</DataTable.Title>
                <DataTable.Title numeric>Hora</DataTable.Title>
                <DataTable.Title numeric>Tipo</DataTable.Title>
              </DataTable.Header>

              {
                transaccionesResumen.map(item => (
                  <DataTable.Row style={item.tipoPago === 1 ? { backgroundColor: '#dbdbdb' } : { backgroundColor: "#d3ffce" }}>
                    <DataTable.Cell><Icon
                      onPress={()=>this.Imprimir(JSON.stringify(item))}
                      name='ios-print'
                      size={28}
                      color='#111'
                    /></DataTable.Cell>
                    <DataTable.Cell><Text style={styles.itemsLista}>{`${this.getNombreCliente(item.cliente)}`}</Text></DataTable.Cell>
                    <DataTable.Cell numeric><Text style={styles.itemsLista}>$ {ccyFormat(item.totalNeto)}</Text></DataTable.Cell>
                    <DataTable.Cell numeric><Text style={styles.itemsLista}>{item.fecha.substring(11, 16)}</Text></DataTable.Cell>
                    <DataTable.Cell numeric><Text style={styles.itemsLista}>{item.tipoPago === 0 ? 'D' : 'C'}</Text></DataTable.Cell>
                  </DataTable.Row>
                ))
              }

              <DataTable.Pagination
                page={1}
                numberOfPages={4}
                onPageChange={this.handleChangeDay}
                label={`${transaccionesResumen.length} ventas hoy`}
              />
            </DataTable>
          </View>

        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollview: {
    paddingTop: 0,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  categories: {
    marginBottom: 40,
  },
  heading: {
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 20,
    paddingBottom: 10,
    color: colors.gray04,
  },
  headingSincronizacion: {
    fontSize: 15,
    fontWeight: '600',
    paddingLeft: 20,
    paddingBottom: 10,
    color: colors.gray05,
  },
  headingSinSincronizacion: {
    fontSize: 15,
    fontWeight: '600',
    paddingLeft: 20,
    paddingBottom: 10,
    color: '#FF0000',
  },
  refrescar: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 0,
    color: colors.gray04,
    marginTop: 0,
    paddingLeft: 20,
    paddingRight: 20,
  },
  tituloTabla: {
    fontSize: 10,
    fontWeight: '600',
    margin: 0,
    color: colors.gray04,
    margin: 0,
    paddingLeft: 20,
    paddingRight: 20,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    color: colors.gray04,
    marginTop: 5,
    paddingLeft: 20,
    paddingRight: 20,
  },
  centrado: {
    backgroundColor: '#dbdbdb',
    flex: 1,
    alignItems: 'center',
    fontSize: 12,
  },
  itemsLista: {
    fontSize: 10,
    marginBottom: 0,
    color: colors.gray04,
    marginTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  refrescarButton: {
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    borderRadius: 3,
    backgroundColor: colors.white,
    borderColor: colors.blue
  },
  refrescarButtonText: {
    fontSize: 12,
    color: colors.blue,
    textAlign: 'center',
    fontWeight: '400',
  },
});


export default Home;
