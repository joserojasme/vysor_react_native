import { BluetoothEscposPrinter } from "react-native-bluetooth-escpos-printer";

export function numberFormat(num) {
    return num.toString().replace(/(\d)(?:(?=\d+(?=[^\d.]))(?=(?:[0-9]{3})+\b)|(?=\d+(?=\.))(?=(?:[0-9]{3})+(?=\.)))/g, "$1,");
}

function ccyFormat(num) {
    num = parseFloat(num);
    let value = `${num.toFixed(2)}`;
    return numberFormat(value);
}

export async function Imprimir(dataTransaccion, clientes, isCopy) {
    let cliente = clientes;
    if (!isCopy) {
        cliente = await clientes.filter(item => {         
            return item.id == dataTransaccion.cliente
        })
    } 
   
    try {
        await BluetoothEscposPrinter.printerInit();
        await BluetoothEscposPrinter.printerLeftSpace(0);

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
        await BluetoothEscposPrinter.setBlob(0);
        await BluetoothEscposPrinter.printText("Lacteos DQ\r\n", {
            encoding: 'GBK',
            codepage: 0,
            widthtimes: 2,
            heigthtimes: 2,
            fonttype: 1
        });

        await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
        await BluetoothEscposPrinter.printText("Distribuidor autorizado\r\n", {});
        await BluetoothEscposPrinter.printText("productos betania\r\n", {});
        await BluetoothEscposPrinter.printText("NIT: 8150307-8\r\n", {});
        await BluetoothEscposPrinter.printText("REGIMEN COMUN \r\n", {});
        await BluetoothEscposPrinter.printText("TEL: 3146848070 \r\n", {});
        await BluetoothEscposPrinter.printText("GIRARDOTA \r\n", {});
        await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
        await BluetoothEscposPrinter.setBlob(0);
        await BluetoothEscposPrinter.printText(`Factura de venta : ${dataTransaccion.prefijo}-${dataTransaccion.numero} \r\n`, {
            encoding: 'GBK',
            codepage: 0,
            widthtimes: 0,
            heigthtimes: 0,
            fonttype: 1
        });
        await BluetoothEscposPrinter.printText(`Fecha：${dataTransaccion.fecha}\r\n`, {});
        await BluetoothEscposPrinter.printText(`Cliente：${isCopy ? cliente.nombre : cliente[0].nombre}\r\n`, {});
        await BluetoothEscposPrinter.printText(`NIT: ${isCopy ? cliente.identificacion : cliente[0].identificacion}\r\n`, {});

        let columnWidths = [5, 11, 8, 8];
        await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
        await BluetoothEscposPrinter.printColumn(columnWidths,
            [BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ["Cant", 'Descrip', 'Iva', 'Total'], {});
        await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
        await dataTransaccion.detalleFactura.map((item) => {
            let columnDetalle = [5, 11, 8, 8];
            BluetoothEscposPrinter.printColumn(columnDetalle,
                [BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT, BluetoothEscposPrinter.ALIGN.RIGHT],
                [item.cantidad, `${item.producto.nombre} VLR UNITARIO: $${ccyFormat(item.precio)}`, `${item.iva}%`, `$${ccyFormat(item.precioTotal)}`], {});
            BluetoothEscposPrinter.printText("--------------------------------\r\n", {});

        })
        await BluetoothEscposPrinter.printColumn([16, 16],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ["Subtotal:", `$${ccyFormat(dataTransaccion.totalBruto)}`], {});
        await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
        await BluetoothEscposPrinter.printColumn([16, 16],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ["Impuestos:", `$${ccyFormat(dataTransaccion.totalIva)}`], {});
        await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
        await BluetoothEscposPrinter.printColumn([16, 16],
            [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
            ["TOTAL:", `$${ccyFormat(dataTransaccion.totalNeto)}`], {});
        await BluetoothEscposPrinter.printText("--------------------------------\r\n", {});
        await BluetoothEscposPrinter.printText(`Tipo de pago：${dataTransaccion.tipoPago === 0 ? 'Debito' : 'Credito'}\r\n`, {});
        await BluetoothEscposPrinter.printText("\r\n", {});
        await BluetoothEscposPrinter.setBlob(0);
        await BluetoothEscposPrinter.printText(`Resolucion DIAN：18763000745471 \r\n`, {});
        await BluetoothEscposPrinter.printText(`de 29/09/2019 \r\n`, {});
        await BluetoothEscposPrinter.printText(`desde AV 1 hasta AV 1000 \r\n`, {});
        await BluetoothEscposPrinter.printText("\r\n", {});
        await BluetoothEscposPrinter.printText(`Vysor App - WhatsApp: 3137694741 \r\n`, {
            encoding: 'GBK',
            codepage: 0,
            widthtimes: 0,
            heigthtimes: 0,
            fonttype: 1
        });

        await BluetoothEscposPrinter.printText("\r\n\r\n\r\n", {});
    } catch (e) {
        alert(`No fue posible imprimir la factura, por favor revise que la impresora se encuentre conectada ${e.message}`);
    }
}