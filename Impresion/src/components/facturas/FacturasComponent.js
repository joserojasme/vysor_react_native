import NetInfo from "@react-native-community/netinfo";
import { Body, Form, Header, Icon, Input, Item, Left, List, ListItem, Picker, Right, Toast } from 'native-base';
import React, { Component } from 'react';
import { AsyncStorage, Modal, Platform, ScrollView, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { DataTable } from 'react-native-paper';
import { GuardarTransaccion } from '../../api/apiUtils';
import colors from '../../styles/colors';
import Loader from '../Loader';
import { numberFormat, Imprimir } from '../../utils/funcionesUtiles';

function ccyFormat(num) {
  num = parseFloat(num);
  let value = `${num.toFixed(2)}`;
  return numberFormat(value);
}

const resFacturacion = "resolucionFacturacion";

export default class FacturasComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clienteSeleccionado: '',
      productoSeleccionado: '',
      cantidadSeleccionada: '',
      tipoPagoSeleccionado: 'Debito',
      tiposPago: ["Debito", "Credito"],
      productos: [],
      clientes: [],
      listaPreciosxProducto: [],
      botonAgregarDisable: true,
      modalProductosVisible: false,
      itemsFactura: [],
      valorTotalIva: 0,
      valorTotalBruto: 0,
      valorTotalNeto: 0,
      descuentos: 0,
      resolucionFacturacion: {},
      modalVisible: false,
      dataTransaccion: null
    };
    this.handleClienteChange = this.handleClienteChange.bind(this);
    this.handleTipoPagoChange = this.handleTipoPagoChange.bind(this);
    this.handleProductoChange = this.handleProductoChange.bind(this);
    this.handleCantidadChange = this.handleCantidadChange.bind(this);
    this.obtenerDatosAsyncStorage = this.obtenerDatosAsyncStorage.bind(this);
    this.handleCerrarModal = this.handleCerrarModal.bind(this);
    this.handleAbrirModal = this.handleAbrirModal.bind(this);
    this.handleAgregarItem = this.handleAgregarItem.bind(this);
    this.handleBorrarItemDetalle = this.handleBorrarItemDetalle.bind(this);
    this.validarObligatorios = this.validarObligatorios.bind(this);
    this.handleEnviar = this.handleEnviar.bind(this);
  }

  componentDidMount() {
    this.obtenerDatosAsyncStorage();
    this.obtenerDatosResolucion();
  }

  obtenerDatosResolucion = async () => {
    let resolucionFacturacion = await JSON.parse(await AsyncStorage.getItem(resFacturacion));
    if (resolucionFacturacion === null) {
      this.Notificacion('Sincronice la resolución de facturación', 'danger');
      return false;
    } else {
      this.setState({ resolucionFacturacion: resolucionFacturacion })
      return true;
    }
  }

  modificarDatosResolucion = async () => {
    this.obtenerDatosResolucion();
    let resolucionFacturacion = await JSON.parse(await AsyncStorage.getItem(resFacturacion));
    resolucionFacturacion.numActual += 1;
    this.setState({ resolucionFacturacion: resolucionFacturacion }, async () => {
      await AsyncStorage.removeItem(resFacturacion)
      await AsyncStorage.setItem(resFacturacion, JSON.stringify(resolucionFacturacion));
    })
  }

  obtenerDatosAsyncStorage = async () => {
    let clientes = await JSON.parse(await AsyncStorage.getItem("clientes"));
    let productos = await JSON.parse(await AsyncStorage.getItem("productos"));
    let listaPreciosxProducto = await JSON.parse(await AsyncStorage.getItem("listaPreciosxProducto"));
    clientes.push({ nombre: '1. Seleccione...', id: 'x01', referenciaNombre: '' })
    productos.push({ nombre: '1. Seleccione...', id: 'x01', codigo: '' })

    await clientes.sort(function (a, b) {
      let nombre = a.nombre.toString().toLowerCase();
      let nombreComparar = b.nombre.toString().toLowerCase();
      if (nombre > nombreComparar) {
        return 1;
      }
      if (nombre < nombreComparar) {
        return -1;
      }
      return 0;
    });

    await productos.sort(function (c, d) {
      let nombre = c.nombre.toString().toLowerCase();
      let nombreComparar = d.nombre.toString().toLowerCase();
      if (nombre > nombreComparar) {
        return 1;
      }
      if (nombre < nombreComparar) {
        return -1;
      }
      return 0;
    });

    this.setState({ clientes: clientes, productos: productos, listaPreciosxProducto: listaPreciosxProducto })
  }

  fechaActual = () => {
    let fecha = new Date();
    let ano = fecha.getFullYear();
    let mes = fecha.getMonth() + 1;
    let dia = fecha.getDate();
    let hora = fecha.getHours();
    let minutos = fecha.getMinutes();
    let fechaActual = `${ano}-${mes.toString().length == 1 ? '0' + mes : mes}-${dia.toString().length == 1 ? '0' + dia : dia} ${hora.toString().length == 1 ? '0' + hora : hora}:${minutos.toString().length == 1 ? '0' + minutos : minutos}`;
    return fechaActual;
  }

  validarBotonDisable = () => {
    const { productoSeleccionado, cantidadSeleccionada } = this.state;
    if (productoSeleccionado != '' && cantidadSeleccionada != '' && productoSeleccionado != 'x01' && cantidadSeleccionada != '0') {
      this.setState({ botonAgregarDisable: false })
    } else {
      this.setState({ botonAgregarDisable: true })
    }
  }

  handleClienteChange(value) {
    this.obtenerDatosResolucion();
    this.setState({ clienteSeleccionado: value, itemsFactura: [] }, () => { });
  }

  handleTipoPagoChange(value) {
    this.obtenerDatosResolucion();
    this.setState({ tipoPagoSeleccionado: value }, () => { });
  }

  handleProductoChange(value) {
    this.setState({ productoSeleccionado: value }, () => {
      this.validarBotonDisable();
    });
  }

  handleCantidadChange(value) {
    this.setState({ cantidadSeleccionada: value }, () => {
      this.validarBotonDisable();
    });
  }

  handleCerrarModal = () => {
    this.setState({ modalProductosVisible: false })
  }

  handleAbrirModal = () => {
    this.obtenerDatosResolucion();
    if (this.state.clienteSeleccionado != '' && this.state.clienteSeleccionado != 'x01') {
      this.setState({ modalProductosVisible: true })
    } else {
      this.Notificacion('Seleccione un cliente', 'danger');
    }
  }

  handleAgregarItem = async () => {
    const { clienteSeleccionado,
      productoSeleccionado, cantidadSeleccionada, productos, clientes, listaPreciosxProducto } = this.state;

    let cliente = await clientes.filter(item => {
      return item.id == clienteSeleccionado;
    })

    let producto = await productos.filter(item => {
      return item.id == productoSeleccionado;
    })

    let precioxProducto = await listaPreciosxProducto.filter(item => {
      if (item.idListaPrecio == cliente[0].idListaPrecios && item.idProducto == productoSeleccionado) {
        return item;
      }
    })

    let precioBruto;
    precioBruto = await (cantidadSeleccionada * precioxProducto[0].precio);

    let valorTotalIva = 0;

    let precioTotal;
    if (precioxProducto[0].iva < 1 || precioxProducto[0].iva == null) {
      precioTotal = await (cantidadSeleccionada * precioxProducto[0].precio);
    } else {
      valorTotalIva = await ((cantidadSeleccionada * precioxProducto[0].precio) * (precioxProducto[0].iva / 100));
      precioTotal = await (cantidadSeleccionada * precioxProducto[0].precio) + valorTotalIva;
    }

    let itemsFactura = await {
      "producto": producto[0],
      "iva": precioxProducto[0].iva,
      "precio": precioxProducto[0].precio,
      "cantidad": cantidadSeleccionada,
      "precioTotal": precioTotal,
      "precioBruto": precioBruto,
      "valorTotalIva": valorTotalIva,
      "IdProducto": producto[0].id
    }

    this.setState({
      itemsFactura: [...this.state.itemsFactura, itemsFactura], modalProductosVisible: false,
      productoSeleccionado: 'x01', cantidadSeleccionada: '', botonAgregarDisable: true
    }, () => {
      this.calcularValoresTotales();
    });
  }

  calcularValoresTotales = async () => {
    const { itemsFactura } = this.state;
    let valorTotalIva = await itemsFactura.map(({ valorTotalIva }) => parseFloat(valorTotalIva)).reduce((sum, i) => sum + i, 0);
    let valorTotalBruto = await itemsFactura.map(({ precioBruto }) => parseFloat(precioBruto)).reduce((sum, i) => sum + i, 0);
    let valorTotalNeto = await valorTotalBruto + valorTotalIva;
    this.setState({ valorTotalBruto: valorTotalBruto, valorTotalIva: valorTotalIva, valorTotalNeto: valorTotalNeto });
  }

  handleBorrarItemDetalle = (value, id) => {
    const { itemsFactura } = this.state;
    let newItems = itemsFactura.filter(item => {
      if (item.producto.id != id) {
        return item;
      }
    })

    this.setState({ itemsFactura: newItems }, () => {
      this.calcularValoresTotales();
    })
  }

  FechaVenta = async () => {
    let fecha = new Date();
    let ano = fecha.getFullYear();
    let mes = fecha.getMonth() + 1;
    let dia = fecha.getDate();
    let hora = fecha.getHours();
    let minutos = fecha.getMinutes();
    let segundos = fecha.getSeconds();

    let fechaSincronizado = await `${ano}-${mes.toString().length == 1 ? '0' + mes : mes}-${dia.toString().length == 1 ? '0' + dia : dia} ${hora.toString().length == 1 ? '0' + hora : hora}:${minutos.toString().length == 1 ? '0' + minutos : minutos}:${segundos.toString().length == 1 ? '0' + segundos : segundos}`
    return fechaSincronizado;
  }



  handleEnviar = async () => {
    await this.obtenerDatosResolucion();
  
    let validar = await this.validarObligatorios();
    if (!validar) {
      this.Notificacion('Falta información por ingresar', 'danger');
      return;
    }

    let transacciones = [];
    const { clienteSeleccionado,
      itemsFactura,
      valorTotalIva,
      valorTotalBruto,
      valorTotalNeto,
      resolucionFacturacion, tipoPagoSeleccionado, clientes } = this.state;
      
    let codigoPOS = await AsyncStorage.getItem("codigoPOS");
    //Se envia tipo de pago debito con código 0 y crédito con código 1
    let tipoPago = 0;
    if(tipoPagoSeleccionado == "Credito"){
      tipoPago = 1;
    }

    let dataTransaccion = await {
      "fecha": await this.FechaVenta(),
      "prefijo": resolucionFacturacion.prefijo,
      "numero": resolucionFacturacion.numActual,
      "cliente": clienteSeleccionado,
      "totalIva": valorTotalIva,
      "detalleFactura": itemsFactura,
      "totalBruto": valorTotalBruto,
      "totalNeto": valorTotalNeto,
      "tipoPago": tipoPago,
      "idResolucionDian": resolucionFacturacion.idresolucionDian
    }

    let dataNewTransaccion = await {
      "idTransacciones": `${codigoPOS}-${Math.floor(Date.now())}`,
      "fecha": await this.FechaVenta(),
      "tipo": 1,
      "estado": 1,
      "data": `${JSON.stringify(dataTransaccion)}`,
      "intentos": 1
    }

    transacciones.push(dataNewTransaccion);

    await this.modificarDatosResolucion();
    this.setState({
      clienteSeleccionado: '',
      productoSeleccionado: '',
      cantidadSeleccionada: '',
      botonAgregarDisable: true,
      itemsFactura: [],
      valorTotalIva: 0,
      valorTotalBruto: 0,
      valorTotalNeto: 0,
      dataTransaccion: {}
    })

    await this.AdministrarStorageTransacciones(dataNewTransaccion, "transaccionesResumen");

    this.setState({ modalVisible: false }, () => {
      this.ValidarInternet().then(result => {
        if (result) {
          GuardarTransaccion(transacciones).then(result => {
            if (result.status === 200) {
              this.setState({ modalVisible: false, }, async () => {
                if (result.data[0].estado != 4) {
                  await this.AdministrarStorageTransacciones(dataNewTransaccion, "transacciones");
                  this.Notificacion('Pendiente para sincronizar', 'danger');
                } else {
                  this.Notificacion('Sincronizado', 'success');
                }

              })
            } else {
              this.setState({ modalVisible: false, }, async () => {
                await this.AdministrarStorageTransacciones(dataNewTransaccion, "transacciones");
                this.Notificacion('No fue posible sincronizar. Guardado en pendientes', 'warning');
              });
            }
          });
        } else {
          this.setState({ modalVisible: false }, async () => {
            await this.AdministrarStorageTransacciones(dataNewTransaccion, "transacciones");
            this.Notificacion('Sin internet. Guardado en pendientes', 'warning');
          });
        }
        Imprimir(dataTransaccion,clientes,false);
      })
    })
  }

  AdministrarStorageTransacciones = async (data, nombre) => {
    let transacciones = await JSON.parse(await AsyncStorage.getItem(nombre));
    if (transacciones == null) {
      transacciones = [];
    }
    await transacciones.push(data);
    await AsyncStorage.removeItem(nombre)
    await AsyncStorage.setItem(nombre, JSON.stringify(transacciones));
  }

  validarObligatorios = async () => {
    const { clienteSeleccionado, itemsFactura, valorTotalIva,
      valorTotalBruto, valorTotalNeto, resolucionFacturacion } = this.state;

    if (resolucionFacturacion.numActual == undefined) return false;
    if (clienteSeleccionado === '') return false;
    if (itemsFactura.length == 0) return false;
    if (valorTotalBruto == 0) return false;
    if (valorTotalNeto == 0) return false;

    return true;
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

  Notificacion = async (mensaje, type) => {
    await Toast.show({
      text: mensaje,
      position: "top",
      buttonText: "Ok",
      type: type,
      duration: 3000,
    })
  }

  render() {
    const { clienteSeleccionado, productoSeleccionado, cantidadSeleccionada, productos,
      clientes, botonAgregarDisable, modalProductosVisible, itemsFactura, valorTotalIva,
      valorTotalBruto, valorTotalNeto, resolucionFacturacion, modalVisible, tiposPago, tipoPagoSeleccionado, dataTransaccion } = this.state;

    return (
      <View>
        <Loader animationType='fade' modalVisible={modalVisible} />
        <ScrollView style={styles.scrollView}>
          <Header style={{ backgroundColor: '#fff', }}>
            <Text style={styles.heading}>
              {`Factura # ${resolucionFacturacion.prefijo == undefined ? '' : resolucionFacturacion.prefijo} ${resolucionFacturacion.numActual == undefined ? '' : resolucionFacturacion.numActual}`}
            </Text>
          </Header>
          <View>
            <TouchableHighlight onPress={this.obtenerDatosAsyncStorage} style={styles.refrescarButton}>
              <Text style={styles.refrescarButtonText}>
                REFRESCAR DATOS
          </Text>
            </TouchableHighlight>
          </View>
          <View>
            <Text style={styles.subtitle}>
              Cliente:
          </Text>
            <Form>
              <Item picker>
                <Picker
                  mode="dropdown"
                  iosIcon={<Icon name="arrow-down" />}
                  style={{ width: undefined }}
                  placeholder="Seleccione un cliente"
                  placeholderStyle={{ color: "#bfc6ea" }}
                  placeholderIconColor="#007aff"
                  selectedValue={clienteSeleccionado}
                  onValueChange={this.handleClienteChange}
                >
                  {clientes.map((item, i) => (
                    <Picker.Item key={i} label={`${item.nombre} - ${item.referenciaNombre}`} value={item.id} />
                  ))
                  }
                </Picker>
              </Item>
            </Form>
          </View>
          <View>
            <Text style={styles.subtitle}>
              Tipo de pago:
          </Text>
            <Form>
              <Item picker>
                <Picker
                  mode="dropdown"
                  iosIcon={<Icon name="arrow-down" />}
                  style={{ width: undefined }}
                  placeholder="Seleccione un tipo de pago"
                  placeholderStyle={{ color: "#bfc6ea" }}
                  placeholderIconColor="#007aff"
                  selectedValue={tipoPagoSeleccionado}
                  onValueChange={this.handleTipoPagoChange}
                >
                  {tiposPago.map((item, i) => (
                    <Picker.Item key={i} label={item} value={item} />
                  ))
                  }
                </Picker>
              </Item>
            </Form>
          </View>

          <TouchableHighlight onPress={this.handleAbrirModal} style={styles.findHomesButton}>
            <Text style={styles.findHomesButtonText}>
              AGREGAR PRODUCTO
          </Text>
          </TouchableHighlight>

          <View>
            <DataTable >
              <DataTable.Header>
                <DataTable.Title >Acción</DataTable.Title>
                <DataTable.Title >Producto</DataTable.Title>
                <DataTable.Title numeric>Total</DataTable.Title>
              </DataTable.Header>

              <List>
                {
                  itemsFactura.map(item => (
                    <ListItem key={item.producto.id} thumbnail>
                      <Left>
                        <TouchableHighlight onPress={(event) => this.handleBorrarItemDetalle(event, item.producto.id)} transparent>
                          <Text style={styles.itemsLista}>Borrar</Text>
                        </TouchableHighlight>
                      </Left>
                      <Body>
                        <Text style={styles.itemsLista}>{`${item.producto.nombre}`}</Text>
                        <Text style={styles.itemsLista} note numberOfLines={1}>{`Cantidad: ${ccyFormat(item.cantidad)} Iva: ${item.iva} % `}</Text>
                        <Text style={styles.itemsLista} note numberOfLines={1}>{`Unitario: $ ${ccyFormat(item.precio)}`}</Text>
                      </Body>
                      <Right>
                        <Text style={styles.itemsLista} note numberOfLines={1}>{`$ ${ccyFormat(item.precioBruto)}`}</Text>
                        <Text style={styles.itemsLista}>$ {ccyFormat(item.precioTotal)}</Text>
                      </Right>
                    </ListItem>
                  ))
                }

              </List>
            </DataTable>
          </View>

          <View>
            <List >
              <ListItem key={2501} thumbnail>

                <Body>
                  <Text style={styles.itemsLista} numberOfLines={1}>Valor Bruto:</Text>
                  <Text style={styles.itemsLista} numberOfLines={1}>Total Impuestos:</Text>
                </Body>
                <Right>
                  <Text style={styles.itemsLista}>{`         $${ccyFormat(valorTotalBruto)}`}</Text>
                  <Text style={styles.itemsLista}>{`   $${ccyFormat(valorTotalIva)}`}</Text>
                </Right>
              </ListItem>
            </List>
          </View>
          <View>
            <List >
              <ListItem key={2500} thumbnail>
                <Body>
                  <TouchableHighlight transparent>
                    <Text style={styles.itemsLista}>TOTAL</Text>
                  </TouchableHighlight>
                </Body>
                <Right>
                  <Text style={styles.itemsLista}>$ {`${ccyFormat(valorTotalNeto)}`}</Text>
                </Right>
              </ListItem>
            </List>
          </View>

          <View>
            <TouchableHighlight disabled={valorTotalNeto > 0 ? false : true} onPress={this.handleEnviar} style={styles.findHomesButton}>
              <Text style={styles.findHomesButtonText}>
                ENVIAR FACTURA
        </Text>

            </ TouchableHighlight>
            
          </View>



        </ScrollView>



        <View >
          <Modal
            animationType="slide"
            transparent={false}
            visible={modalProductosVisible}
            onRequestClose={() => {
              this.handleCerrarModal
            }}>
            <View style={{ marginTop: 22 }}>
              <TouchableHighlight onPress={this.obtenerDatosAsyncStorage} style={styles.refrescarButton}>
                <Text style={styles.refrescarButtonText}>
                  REFRESCAR DATOS
          </Text>
              </TouchableHighlight>

              <View
                style={{
                  borderBottomColor: '#128BCC',
                  borderBottomWidth: 2,
                }}
              />

              <View>
                <Text style={styles.subtitle}>
                  Producto:
          </Text>
                <Form>
                  <Item picker>
                    <Picker
                      mode="dropdown"
                      iosIcon={<Icon name="arrow-down" />}
                      style={{ width: undefined }}
                      placeholder="Seleccione un producto"
                      placeholderStyle={{ color: "#bfc6ea" }}
                      placeholderIconColor="#007aff"
                      selectedValue={productoSeleccionado}
                      onValueChange={this.handleProductoChange}
                    >
                      {productos.map((item, i) => (
                        <Picker.Item key={i} label={`${item.nombre} - ${item.codigo}`} value={item.id} />
                      ))
                      }
                    </Picker>
                  </Item>
                </Form>
              </View>

              <View>
                <Text style={styles.subtitle}>
                  Cantidad:
          </Text>
                <Form>
                  <Item>

                    <Input
                      placeholder='Ingrese la cantidad'
                      keyboardType='numeric'
                      onChangeText={this.handleCantidadChange}
                      value={cantidadSeleccionada}
                    />
                  </Item>
                </Form>
              </View>
              <View style={!botonAgregarDisable ? null : { display: 'none' }} >
                <TouchableHighlight onPress={this.handleAgregarItem} style={styles.findHomesButton}>
                  <Text style={styles.findHomesButtonText}>
                    AGREGAR
          </Text>
                </TouchableHighlight>
              </View>
              <TouchableHighlight onPress={this.handleCerrarModal} style={styles.findHomesButton}>
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
    height: '100%'
  },
  heading: {
    fontSize: 18,
    fontWeight: '400',
    marginBottom: 0,
    color: colors.blue,
    marginTop: 0,
  },
  fecha: {
    fontSize: 20,
    fontWeight: '300',
    marginBottom: 2,
    color: colors.gray04,
    marginTop: 5,
    paddingLeft: 40,
    paddingRight: 20,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 0,
    color: colors.gray04,
    marginTop: 0,
    paddingLeft: 10,
    paddingRight: 20,
  },

  description: {
    fontSize: 16,
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
    marginTop: 16,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },
  findHomesButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '600',
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
  itemsLista: {
    fontSize: 10,
    marginBottom: 0,
    color: colors.gray04,
    marginTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
  }
});

const cantidades = [
  '0',

]

{/* <Item picker>
                    <Picker
                      mode="dropdown"
                      iosIcon={<Icon name="arrow-down" />}
                      style={{ width: undefined }}
                      placeholder="Seleccione una cantidad"
                      placeholderStyle={{ color: "#bfc6ea" }}
                      placeholderIconColor="#007aff"
                      selectedValue={cantidadSeleccionada}
                      onValueChange={this.handleCantidadChange}
                    >
                      {cantidades.map((item, i) => (
                        <Picker.Item key={i} label={item} value={item} />
                      ))
                      }

                    </Picker>
                  </Item> */}