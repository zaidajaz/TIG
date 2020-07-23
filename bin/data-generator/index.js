const csv = require('csv-parser');  
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

class Generator{
    init(callback){
        var self = this;
        self.readNames(function(){
            self.readRateList(function(){
                self.readStockList(function(){
                    self.readDailyAmountList(function(){
                        callback();
                    });
                });
            });
        });
    }

    readNames(callback){
        var nameList = [];
        var self = this;
        fs.createReadStream('input/NameList.csv')  
        .pipe(csv())
        .on('data', function(row) {
            nameList.push(row);
        }).on('end', function() {
            self.nameList = nameList;
            callback();
        });
    }

    readRateList(callback){
        var rateList = [];
        var self = this;
        fs.createReadStream('input/RateList.csv')  
        .pipe(csv())
        .on('data', function(row) {
            rateList.push(row);
        }).on('end', function() {
            self.rateList = JSON.parse(JSON.stringify(rateList));
            callback();
        });
    }

    readStockList(callback){
        var stockList = [];
        var self = this;
        fs.createReadStream('input/stockList.csv')  
        .pipe(csv())
        .on('data', function(row) {
            stockList.push(row);
        }).on('end', function() {
            self.stockList = JSON.parse(JSON.stringify(stockList));
            callback();
        });
    }

    readDailyAmountList(callback){
        var amountList = [];
        var self = this;
        fs.createReadStream('input/DailyAmountList.csv')  
        .pipe(csv())
        .on('data', function(row) {
            amountList.push(row);
        }).on('end', function() {
            self.amountList = JSON.parse(JSON.stringify(amountList));
            callback();
        });
    }

    getRandomName(){
        let randomNumber = Math.floor(Math.random() * Math.floor(this.nameList.length - 1));
        return JSON.parse(JSON.stringify(this.nameList))[randomNumber].Name;
    }

    generate() {
        this.output = [];
        var self = this;
        this.stockList.forEach((element)=>{
            var itemQty = element.Qty.split(' ')[0];
            for(var i=1;i<=itemQty;i++){
                var outputObj =     {
                    "sno": "",
                    "date": "",
                    "name": "",
                    "item": "",
                    "qty": "",
                    "GST":"",
                    "amount":"",
                    "cgst":"",
                    "sgst":"",
                    "rateListPrice":"",
                    "listPrice":"",
                    "invoiceNumber":"",
                    "gstin":"",
                    "placeOfSupply":"",
                    "hsnCode":""
                };
                outputObj.item = element.Item;
                outputObj.qty = 1;
                outputObj.name = self.getRandomName();
                outputObj.listPrice = self.getListPriceAndGST(element.Item)[0];
                outputObj.GST = self.getListPriceAndGST(element.Item)[1];
                let gstFactor = (parseInt(outputObj.GST) + 100)/100;
                outputObj.amount = parseFloat(outputObj.listPrice/gstFactor).toFixed(2);
                outputObj.cgst = outputObj.sgst = parseFloat(outputObj.amount * outputObj.GST/200).toFixed(2);
                this.output.push(outputObj);
            }
            let sno = 1;
            this.output.forEach((element)=>{
                element.sno = sno;
                sno++;
            });
        });
        this.output = this.shuffle(this.shuffle(this.output));
    }

    groupByDate(){
        var self = this;
        this.amountList.forEach((element)=>{
            var amount = parseFloat(element.amount).toFixed(2);
            var date = element.date;
            var sum = 0;
            for(let i=0;i<=this.output.length-1;i++) {
                let oel = this.output[i];
                if(oel.date === ''){
                    if(sum >= amount)  return;
                    let testSum = sum + parseFloat(oel.listPrice);
                    if(testSum >= amount) {
                        oel = self.reOrganizeOutput(oel, sum, amount);
                    }
                    sum = sum + parseFloat(oel.listPrice);
                    oel.date = date;
                }
            }
        });
    }

    reOrganizeOutput(currEl, sum, amount) {
        let index = this.output.findIndex((element)=>{
            return element.sno === currEl.sno;
        });
        if(index != -1) {
            let lowestDiffIndex = this.findLowestDiffIndex(index, sum, amount);
            this.swap(index, lowestDiffIndex);
        }
        return this.output[index];
    }

    findLowestDiffIndex(index, sum, amount) {
        let lowestDiff = Math.abs(sum + parseFloat(this.output[index].listPrice) - amount);
        let lowestDiffIndex = index;
        for(let i=index+1;i<=this.output.length-1;i++) {
            if(Math.abs(sum + parseFloat(this.output[i].listPrice) - amount) <= lowestDiff) {
                lowestDiff = Math.abs(sum + parseFloat(this.output[i].listPrice) - amount);
                lowestDiffIndex = i;
            }
        }
        return lowestDiffIndex;
    }

    swap(index, swapIndex) {
        if(index !== swapIndex) {
            let tempOutput = this.output[swapIndex];
            this.output[swapIndex] = this.output[index];
            this.output[index] = tempOutput;
        }
    }

    getListPriceAndGST(itemName) {
        var listPrice = 0;
        var GST = 0;
        this.rateList.forEach((element)=>{
            if(element.Item === itemName) {
                listPrice = element.Price;
                GST = element.GST;
            }
        });
        return [listPrice, GST];
    }

    writeOutput(filename){
        console.log('output filename = ' + filename);
        const csvWriter = createCsvWriter({  
            path: filename + '.csv',
            header: [
            //   {id: 'sno', title:'Sno.'},
              {id: 'date', title: 'date'},
              {id: 'name', title: 'name'},
              {id: 'item', title: 'item'},
              {id: 'qty', title: 'qty'},
              {id: 'GST', title: 'gstPercent'},
              {id: 'amount', title: 'amount'},
              {id: 'cgst', title: 'cgst'},
              {id: 'sgst', title: 'sgst'},
              {id: 'listPrice', title: 'listPrice'},
              {id: 'rateListPrice', title: 'rateListPrice'},
              {id: 'invoiceNumber', title: 'invoiceNumber'},
              {id: 'gstin', title: 'gstin'},
              {id: 'placeOfSupply', title: 'placeOfSupply'},
              {id: 'hsnCode', title: 'hsnCode'}
            ]
          });
          
          const data = this.output;
          csvWriter  
            .writeRecords(data)
            .then(()=> console.log('The CSV file was written successfully'));
    }

    shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;
        
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
        
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
        
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        
        return array;
    }

    groupByItemName(){
        var self = this;
        var mutliItemList = [];
        self.output.forEach((element, index, array) => {
            let elementID = element.date + element.name + element.item;
            let count = array.filter(x => x.date + x.name + x.item == elementID).length;
            if(count > 1) {
                if(mutliItemList.findIndex(element => element.elementID == elementID) == -1){
                    mutliItemList.push({elementID: elementID, count: count});
                }
            }
        });

        let invalidSerials = [];
        mutliItemList.forEach((element) => {
           let tempArray = self.output.filter(x => x.date + x.name + x.item == element.elementID);
           tempArray[0].qty = element.count;

        const gstFactor = (parseInt(tempArray[0].GST) + 100)/100;
        const listPrice = parseFloat(tempArray[0].listPrice) * element.count;
        let amount = (listPrice/gstFactor);
        const cgst = parseFloat(amount * tempArray[0].GST/200).toFixed(2);
        amount = amount.toFixed(2);

           tempArray[0].amount = amount;
           tempArray[0].cgst = tempArray[0].sgst = cgst;
            let serial = tempArray[0].sno;

            const indexInOutput  = self.output.findIndex(el => el.sno == serial);
            self.output[indexInOutput] = tempArray[0];

            tempArray.forEach((e, i) => {
                if(i > 0){
                    invalidSerials.push(e.sno);
                }
            });
        });

        self.output = self.output.filter(element => !invalidSerials.includes(element.sno));
        
        self.reSerialize();
    }

    reSerialize() {
        let newSerial = 1;
        this.output.forEach(element => {
            element.sno = newSerial;
            newSerial++;
        });
    }

    tryMatchTheTotals(allowedDiff) {
        var self = this;
        self.amountList.forEach(amountObj => {
            const date = amountObj.date;
            const expectedAmount = parseFloat(amountObj.amount);
            let calculatedAmount = self.getTotalForDate(date);
            let diffAmount = calculatedAmount - expectedAmount;
            console.log(expectedAmount, calculatedAmount, diffAmount);
            if(diffAmount > 0 && diffAmount <= allowedDiff/100 * expectedAmount) {
                const lowestAmountRowIndex = self.getLowestListPriceRowIndex(date);
                const removedPrice = self.output[lowestAmountRowIndex].listPrice;
                self.output[lowestAmountRowIndex].date = '';
                calculatedAmount = calculatedAmount - removedPrice;
                diffAmount = expectedAmount - calculatedAmount;
                const higestAmountRowIndex = self.getHighestPriceRowIndex(date);
                self.output[higestAmountRowIndex].rateListPrice = self.output[higestAmountRowIndex].listPrice;
                self.output[higestAmountRowIndex].listPrice = parseFloat(self.output[higestAmountRowIndex].listPrice) + diffAmount;
                self.recalculateAmounts(self.output[higestAmountRowIndex].listPrice, higestAmountRowIndex);
            }
        });
    }

    recalculateAmounts(listPrice, index) {
        const gstFactor = (parseInt(this.output[index].GST) + 100)/100;
        let amount = (listPrice/gstFactor);
        const cgst = parseFloat(amount * this.output[index].GST/200).toFixed(2);
        amount = amount.toFixed(2);

        this.output[index].amount = amount;
        this.output[index].cgst = this.output[index].sgst = cgst;
    }

    getTotalForDate(date) {
        let total = 0;
        this.output.forEach(outputObj => {
            if(outputObj.date == date) {
                total += parseFloat(outputObj.listPrice) * parseFloat(outputObj.qty);
            }
        });
        return total;
    }

    getLowestListPriceRowIndex(date) {
        let index = -1;
        let lowestListPrice = Number.POSITIVE_INFINITY;
        let self = this;
        this.output.forEach((outputObj, i) => {
            if(outputObj.date == date) {
                if(parseFloat(outputObj.listPrice) < lowestListPrice) {
                    lowestListPrice = outputObj.listPrice;
                    index = i;
                }
            }
        });
        return index;
    }

    getHighestPriceRowIndex(date) {
        let index = -1;
        let higestListPrice = Number.NEGATIVE_INFINITY;
        let self = this;
        this.output.forEach((outputObj, i) => {
            if(outputObj.date == date) {
                if(parseFloat(outputObj.listPrice) > higestListPrice) {
                    higestListPrice = outputObj.listPrice;
                    index = i;
                }
            }
        });
        return index;
    }

    cleanTheOutput(){
        this.output = this.output.filter(outputObj => outputObj.date!='');
        this.reSerialize();
    }
}


gen = new Generator();
gen.init(function(){
    gen.generate();
    gen.groupByDate();
    gen.groupByItemName();
    gen.tryMatchTheTotals(process.argv[3]?process.argv[3]:2);
    gen.cleanTheOutput();
    gen.writeOutput(process.argv[2]?process.argv[2]:'invoicelist');
});




