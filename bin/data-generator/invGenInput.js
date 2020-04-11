const csv = require('csv-parser');  
const fs = require('fs');
const n2w = require('number-to-words');

class InputGenerator{
    init(callback) {
        var self = this;
        self.readGenOutput(function(){
            callback();
        });
    }
    readGenOutput(callback){
        var genOutput = [];
        var self = this;
        fs.createReadStream('out.csv')  
        .pipe(csv())
        .on('data', function(row) {
            genOutput.push(row);
        }).on('end', function() {
            self.genOutput = JSON.parse(JSON.stringify(genOutput));
            callback();
        });
    }
    createInvoiceGenInput(){
        var grandTotal = 0;
        var input = {
            "companyName":"SUPER TIME",
            "companyAddr":"COURT ROAD, LAL CHOWK, SRINAGAR - 190001",
            "companyGSTIN":"01AARFS1721P1ZY",
            "invoices":[],
            "companyPAN":"AARFS1721"
        };
        // var invoiceObject = {
        //     "invoiceNum": "",
        //     "date": "",
        //     "name": "",
        //     "customerGSTIN":"",
        //     "placeOfSupply":"",
        //     "items": [],
        //      "grandTotal":"",
        //      "amountInWords":""
        // };
        // var itemObject = {
        //     "item": "",
        //     "hsnCode":"",
        //     "qty": "",
        //     "unit":"",
        //     "rate":"",
        //     "GST": "",
        //     "amount": "",
        //     "cgst": "",
        //     "sgst": "",
        //     "itemTotal":""
        // };

        var previousInvoice = -1;
        var self = this;
        this.genOutput.forEach((element, index, array)=>{
            var currentInvoice  = element.invoiceNumber;
            if(currentInvoice === previousInvoice) {
                let amount = parseFloat(element.amount * element.qty).toFixed(2);
                let gstPercent = parseFloat(element.gstPercent);
                let cgst = parseFloat((gstPercent/200)*(element.amount * element.qty)).toFixed(2);
                let itemTotal = parseFloat(parseFloat(amount) + parseFloat(2*cgst));
                grandTotal += itemTotal;
                input.invoices[self.getInvoiceIndex(currentInvoice, input.invoices)].items.push({
                    "item": element.item,
                    "hsnCode":element.hsnCode,
                    "qty": element.qty,
                    "unit":"pcs",
                    "rate":element.amount,
                    "GST": element.gstPercent,
                    "amount": amount,
                    "cgst": cgst,
                    "sgst": cgst,
                    "itemTotal": itemTotal
                });
                if(index === (array.length -1)) {
                    input.invoices[this.getInvoiceIndex(currentInvoice,input.invoices)].grandTotal = grandTotal.toFixed(2);
                    input.invoices[this.getInvoiceIndex(currentInvoice,input.invoices)].amountInWords = "RUPEES " + n2w.toWords(Number(grandTotal.toFixed(2))).toUpperCase() + " ONLY.";
                }
            } else {
                let amount = parseFloat(element.amount * element.qty).toFixed(2);
                let gstPercent = parseFloat(element.gstPercent);
                let cgst = parseFloat((gstPercent/200)*(element.amount * element.qty)).toFixed(2);
                let itemTotal = parseFloat(parseFloat(amount) + parseFloat(2*cgst));
                if(previousInvoice!==-1) {
                    input.invoices[this.getInvoiceIndex(previousInvoice,input.invoices)].grandTotal = grandTotal.toFixed(2);
                    input.invoices[this.getInvoiceIndex(previousInvoice,input.invoices)].amountInWords = "RUPEES " + n2w.toWords(Number(grandTotal.toFixed(2))).toUpperCase() + " ONLY.";
                }

                grandTotal = 0;
                grandTotal += itemTotal;
                input.invoices.push({
                    "invoiceNum": element.invoiceNumber,
                    "date": element.date,
                    "name": element.name,
                    "customerGSTIN":element.gstin,
                    "placeOfSupply":element.placeOfSupply,
                    "items": [
                        {
                            "item": element.item,
                            "hsnCode":element.hsnCode,
                            "qty": element.qty,
                            "unit":"pcs",
                            "rate":element.amount,
                            "GST": element.gstPercent,
                            "amount": amount,
                            "cgst": cgst,
                            "sgst": cgst,
                            "itemTotal": itemTotal
                        }
                    ]
                });
            }
            previousInvoice = currentInvoice;
        });
        this.input = JSON.stringify(input);
    }

    getInvoiceIndex(invoiceNum, inputObj){
        let index = -1;
        let i = -1;
        inputObj.forEach((element)=>{
            i++;
            if(element.invoiceNum === invoiceNum) {
                index = i;
                return;
            }
        });
        return index;
    }

    writeOutput(){
          fs.writeFile('invoiceGen/js/out.json', this.input);
    }
}

inputGen = new InputGenerator();
inputGen.init(function(){
    inputGen.createInvoiceGenInput();
    inputGen.writeOutput();
    // console.log(inputGen.input);
});