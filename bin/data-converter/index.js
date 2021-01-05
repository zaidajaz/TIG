const csv = require('csv-parser');
const fs = require('fs');
const createCSVWriter = require('csv-writer').createObjectCsvWriter;
const uuidv4 = require('uuid').v4;

class Converter {
  readInputFile(callback) {
    var inputFileData = [];
    fs.createReadStream('invoicelist.csv')
      .pipe(csv())
      .on('data', function (row) {
        if (row.date != "")
          inputFileData.push(row);
      })
      .on('end', function () {
        console.log("End of stream");
        callback(inputFileData);
      });
  }
  createVouchers(inputData, callback) {
    let lastVoucherId = inputData[0].date + inputData[0].name;
    let voucherList = [];

    let voucher = [];

    inputData.forEach(function (row) {
      const currentVoucherID = row.date + row.name;

      let currentVoucher = {
        date: row.date,
        name: row.name,
        item: row.item,
        qty: row.qty,
        gstPercent: row.gstPercent,
        amount: row.amount,
        cgst: row.cgst,
        sgst: row.sgst,
        listPrice: row.listPrice
      }

      if (lastVoucherId != currentVoucherID) {
        voucherList.push(voucher);
        voucher = [];
      }

      voucher.push(currentVoucher);

      lastVoucherId = currentVoucherID;

    });
    voucherList.push(voucher);
    callback(voucherList);
  }

  writeOutputFile(inputData, companyName) {
    var guid, address, invDate, className, totalAmount,
      ledgerName, gstRate, partyName, gstRate, gstAmount, stockItemName,
      stockItemRate, amount, quantity, alterID;


    var output1 = `
        <ENVELOPE>
        <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
        </HEADER>
        <BODY>
        <IMPORTDATA>
        <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
        <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
        </REQUESTDESC>
        <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
        `;

    var output2 = "";

    if (!String.prototype.encodeHTML) {
      String.prototype.encodeHTML = function () {
        return this.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };
    }

    var getClassNameForInvoice = (invoice, getLedgerName) => {
      let gstPercent = -1;
      let sameClass = true;
      invoice.forEach(item => {
        if (gstPercent == -1) {
          gstPercent = item.gstPercent;
          return;
        }
        if (gstPercent != item.gstPercent)
          sameClass = false;
      });
      if (sameClass) {
        return getLedgerName ? `SALES ACCOUNT @${gstPercent}%` : `GST INVOICE @ ${gstPercent}%`;
      } else {
        return getLedgerName ? 'SALE' : "GST INVOICE VALID FOR INPUT TAX CREDIT.";
      }
    }

    var getVoucherAmount = (invoice) => {
      let totalAmt = 0;
      invoice.forEach(item => {
        gstAmount = parseFloat(item.cgst) + parseFloat(item.sgst);
        stockItemRate = parseFloat(item.amount).toFixed(2);
        amount = parseFloat(stockItemRate) + gstAmount;

        let amountDecimal = parseFloat(amount - parseInt(amount)).toFixed(2);
        if (amountDecimal == 0.99) {
          stockItemRate = parseFloat(stockItemRate - 0.01).toFixed(2);
          gstAmount = parseFloat(gstAmount) + 0.02;
          amount = parseFloat(stockItemRate) + gstAmount;
        }
        if (amountDecimal == 0.01) {
          stockItemRate = parseFloat(stockItemRate - 0.01).toFixed(2);
          amount = parseFloat(stockItemRate) + gstAmount;
        }

        totalAmt += amount;
      });
      return totalAmt;
    }

    inputData.forEach((custData) => {

      guid = uuidv4();
      address = "Hazratbal , Srinagar.";
      invDate = custData[0].date;
      invDate = invDate.split("-");
      let invDateDD = invDate[0];
      let invDateMM = invDate[1];
      let invDateYY = invDate[2];
      invDate = new Date(invDateMM + "/" + invDateDD + "/" + invDateYY);
      let invDateYYYY = invDate.getFullYear().toString();
      let invDateMonth = (invDate.getMonth() + 1) < 10 ? "0" + (invDate.getMonth() + 1).toString() : (invDate.getMonth() + 1).toString();
      let invDateDay = invDate.getDate() < 10 ? "0" + invDate.getDate() : invDate.getDate().toString();
      invDate = invDateYYYY + invDateMonth + invDateDay;
      partyName = (custData[0].name.encodeHTML());
      alterID = parseInt(Math.random() * 100000);
      className = getClassNameForInvoice(custData);
      ledgerName = getClassNameForInvoice(custData, true);
      totalAmount = getVoucherAmount(custData);

      // gstRate = custData.gstPercent;
      // gstAmount = parseFloat(custData.cgst) + parseFloat(custData.sgst);
      // stockItemName = custData.item;
      // stockItemRate = parseFloat(custData.amount).toFixed(2);
      // amount = parseFloat(stockItemRate) + gstAmount;
      // quantity = custData.qty;

      // let amountDecimal = parseFloat(amount - parseInt(amount)).toFixed(2);
      // if(amountDecimal == 0.99) {
      //   stockItemRate = parseFloat(stockItemRate - 0.01).toFixed(2);
      //   gstAmount = parseFloat(gstAmount) + 0.02;
      //   amount = parseFloat(stockItemRate) + gstAmount;
      // }
      // if(amountDecimal == 0.01) {
      //   stockItemRate = parseFloat(stockItemRate - 0.01).toFixed(2);
      //   amount = parseFloat(stockItemRate) + gstAmount;
      // }

      var voucherDetails1 = `
           <VOUCHER REMOTEID="${guid}" VCHTYPE="Sales" ACTION="Create">
            <ADDRESS.LIST>
              <ADDRESS>${address}</ADDRESS>
            </ADDRESS.LIST>
            <DATE>${invDate}</DATE>
            <GUID>${guid}</GUID>
            <CLASSNAME>${className}</CLASSNAME>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>IV</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>
            <PARTYNAME>${partyName}</PARTYNAME>
            <BASEPARTYNAME>${partyName}</BASEPARTYNAME>
            <CSTFORMISSUETYPE/>
            <CSTFORMRECVTYPE/>
            <FBTPAYMENTTYPE>Default</FBTPAYMENTTYPE>
            <BASICBUYERNAME>${partyName}</BASICBUYERNAME>
            <BASICDATETIMEOFINVOICE>8-Aug-2017 at 12:20</BASICDATETIMEOFINVOICE>
            <BASICDATETIMEOFREMOVAL>8-Aug-2017 at 12:20</BASICDATETIMEOFREMOVAL>
            <VCHGSTCLASS/>
            <DIFFACTUALQTY>No</DIFFACTUALQTY>
            <AUDITED>No</AUDITED>
            <FORJOBCOSTING>No</FORJOBCOSTING>
            <ISOPTIONAL>No</ISOPTIONAL>
            <EFFECTIVEDATE>${invDate}</EFFECTIVEDATE>
            <USEFORINTEREST>No</USEFORINTEREST>
            <USEFORGAINLOSS>No</USEFORGAINLOSS>
            <USEFORGODOWNTRANSFER>No</USEFORGODOWNTRANSFER>
            <USEFORCOMPOUND>No</USEFORCOMPOUND>
            <ALTERID> ${alterID}</ALTERID>
            <ISCANCELLED>No</ISCANCELLED>
            <HASCASHFLOW>No</HASCASHFLOW>
            <ISPOSTDATED>No</ISPOSTDATED>
            <USETRACKINGNUMBER>No</USETRACKINGNUMBER>
            <ISINVOICE>Yes</ISINVOICE>
            <MFGJOURNAL>No</MFGJOURNAL>
            <HASDISCOUNTS>Yes</HASDISCOUNTS>
            <ASPAYSLIP>No</ASPAYSLIP>
            <ISDELETED>No</ISDELETED>
            <ASORIGINAL>No</ASORIGINAL>
            <INVOICEINDENTLIST.LIST>
            </INVOICEINDENTLIST.LIST>
            <LEDGERENTRIES.LIST>
             <LEDGERNAME>${partyName}</LEDGERNAME>
             <GSTCLASS/>
             <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
             <LEDGERFROMITEM>No</LEDGERFROMITEM>
             <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
             <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
             <AMOUNT>-${totalAmount.toFixed(2)}</AMOUNT>
            </LEDGERENTRIES.LIST>
            `;

      var voucherDetails2 = "";

      var totalGSTAmount = 0;

      custData.forEach(entry => {

        gstRate = entry.gstPercent;
        gstAmount = parseFloat(entry.cgst) + parseFloat(entry.sgst);
        stockItemName = entry.item.encodeHTML();
        stockItemRate = parseFloat(entry.amount).toFixed(2);
        quantity = entry.qty;
        amount = parseFloat(stockItemRate) + gstAmount;

        let amountDecimal = parseFloat(amount - parseInt(amount)).toFixed(2);
        if (amountDecimal == 0.99) {
          stockItemRate = parseFloat(stockItemRate - 0.01).toFixed(2);
          gstAmount = parseFloat(gstAmount) + 0.02;
          amount = parseFloat(stockItemRate) + gstAmount;
        }
        if (amountDecimal == 0.01) {
          stockItemRate = parseFloat(stockItemRate - 0.01).toFixed(2);
          amount = parseFloat(stockItemRate) + gstAmount;
        }

        totalGSTAmount += parseFloat((gstAmount / 2).toFixed(2));

        voucherDetails2 += `
              <ALLINVENTORYENTRIES.LIST>
               <STOCKITEMNAME>${stockItemName}</STOCKITEMNAME>
               <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
               <ISAUTONEGATE>No</ISAUTONEGATE>
               <RATE>${(parseFloat(stockItemRate) / parseFloat(quantity)).toFixed(2)}/pcs</RATE>
               <AMOUNT>${stockItemRate}</AMOUNT>
               <ACTUALQTY> ${quantity} pcs</ACTUALQTY>
               <BILLEDQTY> ${quantity} pcs</BILLEDQTY>
               <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>${ledgerName}</LEDGERNAME>
                <CLASSRATE>1.00000</CLASSRATE>
                <GSTCLASS/>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <LEDGERFROMITEM>No</LEDGERFROMITEM>
                <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
                <ISPARTYLEDGER>No</ISPARTYLEDGER>
                <AMOUNT>${stockItemRate}</AMOUNT>
               </ACCOUNTINGALLOCATIONS.LIST>
               <BATCHALLOCATIONS.LIST>
                <MFDON>20190703</MFDON>
                <GODOWNNAME>Main Location</GODOWNNAME>
                <BATCHNAME>Primary Batch</BATCHNAME>
                <DESTINATIONGODOWNNAME>Main Location</DESTINATIONGODOWNNAME>
                <INDENTNO/>
                <ORDERNO/>
                <TRACKINGNUMBER/>
                <AMOUNT>${stockItemRate}</AMOUNT>
                <ACTUALQTY> ${quantity} pcs</ACTUALQTY>
                <BILLEDQTY> ${quantity} pcs</BILLEDQTY>
               </BATCHALLOCATIONS.LIST>
              </ALLINVENTORYENTRIES.LIST>`;
      });
      var gstXML = `
            <LEDGERENTRIES.LIST>
            <LEDGERNAME>SGST</LEDGERNAME>
            <METHODTYPE>On Total Sales</METHODTYPE>
            <GSTCLASS/>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <LEDGERFROMITEM>No</LEDGERFROMITEM>
            <REMOVEZEROENTRIES>Yes</REMOVEZEROENTRIES>
            <ISPARTYLEDGER>No</ISPARTYLEDGER>
            <AMOUNT>${totalGSTAmount.toFixed(2)}</AMOUNT>
           </LEDGERENTRIES.LIST>
           <LEDGERENTRIES.LIST>
            <ROUNDTYPE/>
            <LEDGERNAME>CGST</LEDGERNAME>
            <METHODTYPE>On Total Sales</METHODTYPE>
            <GSTCLASS/>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <LEDGERFROMITEM>No</LEDGERFROMITEM>
            <REMOVEZEROENTRIES>Yes</REMOVEZEROENTRIES>
            <ISPARTYLEDGER>No</ISPARTYLEDGER>
            <AMOUNT>${totalGSTAmount.toFixed(2)}</AMOUNT>
           </LEDGERENTRIES.LIST>
            `;

      voucherDetails2 = gstXML + voucherDetails2;
      voucherDetails2 += `
           </VOUCHER>
           `;

      let voucherDetails = voucherDetails1 + voucherDetails2;
      output2 += voucherDetails;
    });

    var output3 = `
        </TALLYMESSAGE>
        </REQUESTDATA>
        </IMPORTDATA>
        </BODY>
        </ENVELOPE>        
        `;

    fs.writeFile("C:/tally9 original/invoices.xml", output1 + output2 + output3, function () {
      console.log("Output File invoices.xml has been written");
    });
  }

  createLedgerFile() {

    const writeNameXML = (nameList) => {
      const xmlData1 = `
        <ENVELOPE>
        <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
        </HEADER>
        <BODY>
        <IMPORTDATA>
        <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
        <SVCURRENTCOMPANY>Test</SVCURRENTCOMPANY>
        </STATICVARIABLES>
        </REQUESTDESC>
        <REQUESTDATA>`;

      const xmlData3 = `
          </REQUESTDATA>
          </IMPORTDATA>
          </BODY>
          </ENVELOPE>        
        `;

      let xmlData2 = '';
      nameList.forEach(name => {
        xmlData2 += `
          <TALLYMESSAGE xmlns:UDF="TallyUDF">
         <LEDGER NAME="${name.Name}" RESERVEDNAME="">
          <ADDRESS.LIST>
            <ADDRESS></ADDRESS>
          </ADDRESS.LIST>
          <ADDITIONALNAME.LIST>
            <ADDITIONALNAME>${name.Name}</ADDITIONALNAME>
          </ADDITIONALNAME.LIST>
          <CURRENCYNAME>Rs.</CURRENCYNAME>
          <STATENAME>Jammu &amp; Kashmir</STATENAME>
          <PARENT>Sundry Debtors</PARENT>
          <TAXCLASSIFICATIONNAME/>
          <TAXTYPE>Others</TAXTYPE>
          <GSTTYPE/>
          <SERVICECATEGORY/>
          <TRADERLEDNATUREOFPURCHASE/>
          <TDSDEDUCTEETYPE/>
          <TDSRATENAME/>
          <LEDGERFBTCATEGORY/>
          <ISINTERESTON>No</ISINTERESTON>
          <ALLOWINMOBILE>No</ALLOWINMOBILE>
          <ISCONDENSED>No</ISCONDENSED>
          <FORPAYROLL>No</FORPAYROLL>
          <INTERESTONBILLWISE>No</INTERESTONBILLWISE>
          <OVERRIDEINTEREST>No</OVERRIDEINTEREST>
          <OVERRIDEADVINTEREST>No</OVERRIDEADVINTEREST>
          <USEFORVAT>No</USEFORVAT>
          <IGNORETDSEXEMPT>No</IGNORETDSEXEMPT>
          <ISTCSAPPLICABLE>No</ISTCSAPPLICABLE>
          <ISTDSAPPLICABLE>No</ISTDSAPPLICABLE>
          <ISFBTAPPLICABLE>No</ISFBTAPPLICABLE>
          <ISGSTAPPLICABLE>No</ISGSTAPPLICABLE>
          <SHOWINPAYSLIP>No</SHOWINPAYSLIP>
          <USEFORGRATUITY>No</USEFORGRATUITY>
          <FORSERVICETAX>No</FORSERVICETAX>
          <ISINPUTCREDIT>No</ISINPUTCREDIT>
          <ISEXEMPTED>No</ISEXEMPTED>
          <TDSDEDUCTEEISSPECIALRATE>No</TDSDEDUCTEEISSPECIALRATE>
          <AUDITED>No</AUDITED>
          <SORTPOSITION> 1000</SORTPOSITION>
          <LANGUAGENAME.LIST>
           <NAME.LIST>
             <NAME>${name.Name}</NAME>
           </NAME.LIST>
           <LANGUAGEID> 1033</LANGUAGEID>
          </LANGUAGENAME.LIST>
         </LEDGER>
        </TALLYMESSAGE>
        `;
      });

      const xmlData = xmlData1 + xmlData2 + xmlData3;
      fs.writeFile("C:/tally9 original/ledger-master.xml", xmlData, function () {
        console.log("Output File ledger-master.xml has been written");
      });
    }

    const readNameList = () => {
      var nameList = [];
      fs.createReadStream('input/NameList.csv')
        .pipe(csv())
        .on('data', function (row) {
          nameList.push(row);
        })
        .on('end', function () {
          console.log("End of stream");
          writeNameXML(nameList);
        });
    }

    readNameList();

  }
}

converter = new Converter();
converter.readInputFile(function (inputData) {
  let companyName = '';
  if (process.argv[2]) {
    companyName = process.argv[2];
    converter.createVouchers(inputData, function (voucherList) {
      converter.writeOutputFile(voucherList, companyName);
      converter.createLedgerFile();
    });
  } else {
    console.log("ERROR! Company Name not specified");
  }
});