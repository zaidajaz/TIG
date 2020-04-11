const csv = require('csv-parser');
const fs = require('fs');
const createCSVWriter = require('csv-writer').createObjectCsvWriter;
const uuidv4 = require('uuid').v4;

class Converter {
    readInputFile(callback) {
        var inputFileData = [];
        fs.createReadStream('invoicelist.csv')
        .pipe(csv())
        .on('data', function(row) {
            if(row.date != "")
              inputFileData.push(row);
        })
        .on('end', function(){
            console.log("End of stream");
            callback(inputFileData);
        });
    }

    writeOutputFile(inputData, companyName) {
        var guid, address, invDate, gstRate, partyName, gstRate, gstAmount, stockItemName, 
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

        inputData.forEach((custData)=> {
          guid = uuidv4();
          address = "Hazratbal , Srinagar.";
          invDate = custData.date;
          invDate = invDate.replace(/-/g,"");
          //invDate = "20" + invDate[2] + invDate[1] + invDate[0];
          gstRate = custData.gstPercent;
          partyName = (custData.name.encodeHTML());
          gstAmount = parseFloat(custData.cgst) + parseFloat(custData.sgst);
          stockItemName = custData.item;
          stockItemRate = parseFloat(custData.amount).toFixed(2);
          //amount = parseFloat(custData.listPrice).toFixed(2);
          amount = parseFloat(stockItemRate) + gstAmount;
          quantity = custData.qty;
          alterID = parseInt(Math.random()*100000);

          var voucherDetails = `
           <VOUCHER REMOTEID="${guid}" VCHTYPE="Sales" ACTION="Create">
            <ADDRESS.LIST>
              <ADDRESS>${address}</ADDRESS>
            </ADDRESS.LIST>
            <DATE>${invDate}</DATE>
            <GUID>${guid}</GUID>
            <CLASSNAME>GST INVOICE @ ${gstRate}%</CLASSNAME>
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
            <UDF:HARYANAVAT.LIST DESC="\`HARYANAVAT\`">
             <UDF:HARVCHSUBCLASS.LIST DESC="\`HARVCHSUBCLASS\`" ISLIST="YES">
               <UDF:HARVCHSUBCLASS DESC="\`HARVCHSUBCLASS\`">Others</UDF:HARVCHSUBCLASS>
             </UDF:HARVCHSUBCLASS.LIST>
            </UDF:HARYANAVAT.LIST>
            <LEDGERENTRIES.LIST>
             <LEDGERNAME>${partyName}</LEDGERNAME>
             <GSTCLASS/>
             <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
             <LEDGERFROMITEM>No</LEDGERFROMITEM>
             <REMOVEZEROENTRIES>No</REMOVEZEROENTRIES>
             <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
             <AMOUNT>-${amount}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <LEDGERENTRIES.LIST>
             <BASICRATEOFINVOICETAX.LIST>
               <BASICRATEOFINVOICETAX> ${gstRate/2}</BASICRATEOFINVOICETAX>
             </BASICRATEOFINVOICETAX.LIST>
             <ROUNDTYPE/>
             <LEDGERNAME>SGST</LEDGERNAME>
             <METHODTYPE>On Total Sales</METHODTYPE>
             <CLASSRATE>${gstRate/2}</CLASSRATE>
             <GSTCLASS/>
             <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
             <LEDGERFROMITEM>No</LEDGERFROMITEM>
             <REMOVEZEROENTRIES>Yes</REMOVEZEROENTRIES>
             <ISPARTYLEDGER>No</ISPARTYLEDGER>
             <AMOUNT>${(gstAmount/2).toFixed(2)}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <LEDGERENTRIES.LIST>
             <BASICRATEOFINVOICETAX.LIST>
               <BASICRATEOFINVOICETAX> 6</BASICRATEOFINVOICETAX>
             </BASICRATEOFINVOICETAX.LIST>
             <ROUNDTYPE/>
             <LEDGERNAME>CGST</LEDGERNAME>
             <METHODTYPE>On Total Sales</METHODTYPE>
             <CLASSRATE>6</CLASSRATE>
             <GSTCLASS/>
             <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
             <LEDGERFROMITEM>No</LEDGERFROMITEM>
             <REMOVEZEROENTRIES>Yes</REMOVEZEROENTRIES>
             <ISPARTYLEDGER>No</ISPARTYLEDGER>
             <AMOUNT>${(gstAmount/2).toFixed(2)}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <ALLINVENTORYENTRIES.LIST>
             <STOCKITEMNAME>${stockItemName}</STOCKITEMNAME>
             <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
             <ISAUTONEGATE>No</ISAUTONEGATE>
             <RATE>${stockItemRate}/pcs</RATE>
             <AMOUNT>${stockItemRate}</AMOUNT>
             <ACTUALQTY> ${quantity} pcs</ACTUALQTY>
             <BILLEDQTY> ${quantity} pcs</BILLEDQTY>
             <ACCOUNTINGALLOCATIONS.LIST>
              <LEDGERNAME>SALES ACCOUNT @12%</LEDGERNAME>
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
            </ALLINVENTORYENTRIES.LIST>
           </VOUCHER>
           `;

           output2 += voucherDetails;
        });
        
         var output3 =`
        </TALLYMESSAGE>
        </REQUESTDATA>
        </IMPORTDATA>
        </BODY>
        </ENVELOPE>        
        `;

        fs.writeFile("C:/tally9 original/invoices.xml", output1+output2+output3, function(){
          console.log("Output File invoices.xml has been written");
        });
    }
}

converter  = new Converter();
converter.readInputFile(function(inputData){
    let companyName = '';
    if(process.argv[2]) {
      companyName = process.argv[2];
      converter.writeOutputFile(inputData, companyName);
    } else {
      console.log("ERROR! Company Name not specified");
    }
});