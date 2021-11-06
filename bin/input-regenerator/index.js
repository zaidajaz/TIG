const csv = require('csv-parser');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const readInvoiceList = (callback) => {
    var inputFileData = [];
    fs.createReadStream('invoicelist.csv')
      .pipe(csv())
      .on('data', function (row) {
        if (row.date != "") {
            let itemIndex = inputFileData.findIndex(e => e.item === row.item)
            if(itemIndex === -1) {
                inputFileData.push({item: row.item, qty: parseInt(row.qty)});
            } else {
                inputFileData[itemIndex].qty += parseInt(row.qty)
            }
        }
      })
      .on('end', function () {
        callback(inputFileData);
      });
}

const createModifiedStockListData = (lastUsedInvoiceList, callback) => {
    var modifiedStockListData = [];
    fs.createReadStream('input/stockList.csv')
    .pipe(csv())
    .on('data', function (row) {
        let invoiceListIndex = lastUsedInvoiceList.findIndex(e => e.item === row.Item);
        if(invoiceListIndex !== -1) {
            modifiedStockListData.push({
                Item: row.Item,
                Qty: (parseInt(row.Qty.split(" ")[0]) - lastUsedInvoiceList[invoiceListIndex].qty) + " pcs"
            })
        } else {
            modifiedStockListData.push(row);
        }
    })
    .on('end', function () {
      callback(modifiedStockListData);
    });
}

const writeModifiedStockFile = (filename, data) => {
    console.log('output filename = ' + filename);
    const csvWriter = createCsvWriter({
        path: filename + '.csv',
        header: [
            { id: 'Item', title: 'Item' },
            { id: 'Qty', title: 'Qty' },

        ]
    });

    csvWriter
        .writeRecords(data)
        .then(() => console.log('Regenerated StockList successfully!'));
}

readInvoiceList(invoiceListData => {
    createModifiedStockListData(invoiceListData, (newStockData)=>{
        writeModifiedStockFile('input/stockList',newStockData);
    });
});