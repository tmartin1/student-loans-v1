//initialize global variables with default values
var AGI = 0;
var householdSize = 1;
var state = "AL";
var pslfpQulaify = "No";
var totalBalance = 200000;
var balances = [];
var rates = [];
var r = 0; //effective interest rate (will be input rate/12)
var weightedAverage = 0;
var buttonCount = 1;
var results = {
    stdLevel:[],
    stdGrad:[],
    extLevel:[],
    extGrad:[],
    ibr:[],
    paye:[],
    icr:[]
};

var povertyBaseline = 0;
var povertyAdjustment = 0;
var nForgive = 240; //long-term forgiveness timeline (currently 20 months)
//state specific poverty lines and sdjustments for IBR, PAYE, and ICR calcs
var povertyBaseline48 = 11670;
var povertyAdjustment48 = 4060;
var povertyBaselineAK = 14580;
var povertyAdjustmentAK = 5080;
var povertyBaselineHI = 13420;
var povertyAdjustmentHI = 4670;

function addRow(tableID) {
    //adds an additional row to allow for more student loans
    hideResults();
    buttonCount += 1;

    var arrTables = document.getElementById(tableID);
    var numRows = arrTables.rows.length;
    var newRow = document.getElementById(tableID).insertRow(numRows);

    var cell1 = newRow.insertCell(0);
    var element1 = document.createElement("input");
    element1.type = "text";
    element1.style.width = document.getElementById("name1").style.width;
    cell1.appendChild(element1);

    var cell2 = newRow.insertCell(1);
    var element2 = document.createElement("input");
    element2.type = "text";
    element2.style.textAlign = "right";
    element2.style.width = document.getElementById("balance1").style.width;
    element2.onkeypress = function() {
        validate(event);
    }
    element2.onchange = function() {
        totalBalances();
    }
    cell2.appendChild(document.createTextNode("$"));
    cell2.appendChild(element2);

    var cell3 = newRow.insertCell(2);
    var element3 = document.createElement("input");
    element3.type = "text";
    element3.style.textAlign = "right";
    element3.style.width = document.getElementById("rate1").style.width;
    element3.onkeypress = function() {
        validate(event);
    }
    element3.onchange = function() {
        totalBalances();
    }
    cell3.appendChild(element3);
    cell3.appendChild(document.createTextNode("%"));

    //delete button
    var cell4 = newRow.insertCell(3);
    var element4 = document.createElement("input");
    element4.type = "button";
    element4.value = "Delete";
    element4.setAttribute("class", "deleteButton");
    //asign delete button unique id
    var element4id = "delete" + buttonCount;
    element4.id = element4id;
    element4.onclick = function() {
        deleteRow("loans",element4id);
    }
    cell4.appendChild(element4);
}

function deleteRow(tableID,target) {
    //deletes target row
    hideResults();
    totalBalances();
    try {
        var table = document.getElementById(tableID);
        var rowCount = table.rows.length;

        for (var i=2; i<rowCount+2; i++) {
            var row = table.rows[i];
            var seeker = row.cells[3].childNodes[0].id;
            if(seeker === target) {
                table.deleteRow(i);
                rowCount--;
                i--;
                return;
            }
        }
    } catch(e) {
        alert(e);
    }
}

function checkAllNone() {
    if (document.getElementById("selectAll").checked === true) {
        document.getElementById("ten").checked = true;
        document.getElementById("stdGraduated").checked = true;
        document.getElementById("twentyFive").checked = true;
        document.getElementById("extGraduated").checked = true;
        document.getElementById("ibr").checked = true;
        document.getElementById("paye").checked = true;
        document.getElementById("icr").checked = true;
    } else {
        document.getElementById("ten").checked = false;
        document.getElementById("stdGraduated").checked = false;
        document.getElementById("twentyFive").checked = false;
        document.getElementById("extGraduated").checked = false;
        document.getElementById("ibr").checked = false;
        document.getElementById("paye").checked = false;
        document.getElementById("icr").checked = false;
    }
}

function validate(evnt) {
  var theEvent = evnt || window.event;
  var key = theEvent.keyCode || theEvent.which;
  key = String.fromCharCode(key);
  var regex = /[0-9]|\,|\./;
  if(!regex.test(key)) {
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault();
  }
}

function paymentOptions() {
    //clear output before beginning calculations.
    document.getElementById("output").innerHTML = "";
    document.getElementById("warning").innerHTML = "";

    //update inputs before calculations
    AGI = document.getElementById("income").value.replace(/,/g, "") - document.getElementById("retire").value.replace(/,/g, "");
    householdSize = document.getElementById("householdSize").value;
    state = document.getElementById("state").value;
    pslfpQulaify = document.getElementById("pslfpQulaify").value;
    if (pslfpQulaify === "Yes") {
        nForgive = 120;
    } else if (pslfpQulaify === "Yes") {
        nForgive = 240;
    }

    totalBalances();

    //set poverty line adjustment according to resident state (pass this into IBR, PAYE, and ICR)
    if (state === "AK") {
        povertyBaseline = povertyBaselineAK;
        povertyAdjustment = povertyAdjustmentAK;
    } else if (state === "HI") {
        povertyBaseline = povertyBaselineHI;
        povertyAdjustment = povertyAdjustmentHI;
    } else {
        povertyBaseline = povertyBaseline48;
        povertyAdjustment = povertyAdjustment48;
    }

    //run payment calculation methods
    var checks = 0;
    if (document.getElementById("ten").checked) {
        results.stdLevel = tenYearCalc();
        checks++;
    }

    if (document.getElementById("stdGraduated").checked) {
        results.stdGrad = stdGraduatedCalc();
        checks++;
    }

    if (document.getElementById("twentyFive").checked) {
        results.extLevel = twentyFiveYearCalc();
        checks++;
    }

    if (document.getElementById("extGraduated").checked) {
        results.extGrad = extGraduatedCalc();
        checks++;
    }

    if (document.getElementById("ibr").checked) {
        results.ibr = ibrCalc();
        checks++;
    }

    if (document.getElementById("paye").checked) {
        results.paye = payeCalc();
        checks++;
    }

    if (document.getElementById("icr").checked) {
        results.icr = icrCalc();
        checks++;
    }

    if (checks === 0) {
        hideResults();
        document.getElementById("warning").innerHTML = "<br>Please select which repayment options you would like to see.";
    } else {
        displayAsText();
        document.getElementById("displayResults").style.visibility = "visible";
    }
}

function hideResults() {
    //hide results form and remove all output objects (so it doesn't take up a ton of space)
    document.getElementById("displayResults").style.visibility = "hidden";
    var tempNode = document.getElementById("output");
    while (tempNode.firstChild) {
        tempNode.removeChild(tempNode.firstChild);
    }
}

function totalBalances () {
    hideResults();
    var table = document.getElementById("loans");
    var rows = table.rows;
    var numRows = rows.length;
    
    //currently only using the totals, but storing as arrays can allow for more detailed reports later.
    balances = [];
    rates = [];
    weightedAverage = 0;
    totalBalance = 0;

    //load balance and interest rate inputs into their respective arrays
    for (i=1; i<numRows; i++) { //skip first row
        tempBalance = Number(table.rows[i].cells[1].children[0].value.replace(/,/g, ""));
        balances[i-1] = tempBalance;
        totalBalance += tempBalance;
        rates[i-1] = Number(table.rows[i].cells[2].children[0].value.replace(/,/g, ""));
    }

    for (i=0; i<rates.length; i++) {
        weightedAverage += ((balances[i]/totalBalance)*rates[i]);
    }
    r = weightedAverage/12/100;

    //display new totals to page
    document.getElementById("totalLoanBalance").innerHTML = roundedCurrency(totalBalance);
    document.getElementById("dispWeightedAverage").innerHTML = Math.round(weightedAverage*100)/100 + "%";
}

function roundedCurrency(num) {
    //displays numerical value as $#,###,##0 etc.
    var n = Math.round(num).toString();
    return "$" + n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function tenYearCalc() {
    //solve for monthly cost for 10 year level payment plan
    var n = -120;
    var payment = (r*totalBalance)/(1-Math.pow((1+r),n));
    var interest = (120*payment)-totalBalance;
    
    return [payment, document.getElementById("ten").value, interest];
    //displayResults(payment, document.getElementById("ten").value, interest);
}

function stdGraduatedCalc() {
    //solve for standard 10 year graduated payment options.
    var m = 5; //number of payment changes
    var period = 24; //number of months between payment periods
    var g = 0.2945;  //graduated growth rate

    var temp1 = 1;
    for (i=1; i<m; i++) {
        temp1 += Math.pow(((1+g)/(Math.pow(1+r,period))),i);
    }

    var temp2 = ((Math.pow((1+r),period)-1)/(r*Math.pow((1+r),period)));
    document.getElementById("warning").innerHTML += "<br" + temp2;

    var initialPay = totalBalance/(temp1*temp2);

    var finalPay = initialPay*Math.pow((1+g),4);
    
    payment = [initialPay,finalPay];
    //solve for total interest paid with the 10 year graduated plan
    totalPaid = initialPay*24;
    for (i=1; i<m; i++) {
        totalPaid += (initialPay*Math.pow(1+g,i))*24;
    }

    var interest = totalPaid-totalBalance;

    return [payment, document.getElementById("stdGraduated").value, interest, true];
    //displayResults(payment, document.getElementById("stdGraduated").value, interest, true);
}

function twentyFiveYearCalc() {
    //solve for 25 year  level payment options.
    var n = -300;
    var payment = (r*totalBalance)/(1-Math.pow((1+r),n));
    var interest = (300*payment)-totalBalance;
    return [payment, document.getElementById("twentyFive").value, interest];
    //displayResults(payment, document.getElementById("twentyFive").value, interest);
}

function extGraduatedCalc() {
    //solve for 25 year extended graduated payment options.
    var m = 12; //number of payment changes
    var period = 24; //number of months between payment periods
    var g = 0.08;  //graduated growth rate

    var temp1 = 1;
    for (i=1; i<m; i++) {
        temp1 += Math.pow(((1+g)/(Math.pow(1+r,period))),i);
    }

    var temp2 = ((Math.pow((1+r),period)-1)/(r*Math.pow((1+r),period)));
    document.getElementById("warning").innerHTML += "<br" + temp2;

    var initialPay = totalBalance/(temp1*temp2);

    var finalPay = initialPay*Math.pow((1+g),12);
    
    payment = [initialPay,finalPay];
    //solve for total interest paid with the 10 year graduated plan
    totalPaid = initialPay*24;
    for (i=1; i<m-1; i++) {
        totalPaid += (initialPay*Math.pow(1+g,i))*24;
    }
    totalPaid += (initialPay*Math.pow(1+g,13))*24;

    var interest = totalPaid-totalBalance;

    return [payment, document.getElementById("extGraduated").value, interest, true];
    //displayResults(payment, document.getElementById("extGraduated").value, interest, true);
}

function ibrCalc() {
    //solve for IBR payment options.
    //IBR = (15% (AGI - 150% * Poverty Line) / 12
    var payment = (0.15*(AGI-(1.5*povertyBaseline)))/12;

    //client will not qualify for IBR if either:
    //  1. their IBR payment is greater than the standard 10 year payment
    //  2. Or, their annual household income is greater than their total debt
    var qualify = true;
    var compare = (r*totalBalance)/(1-Math.pow((1+r),-120));
    if (AGI > totalBalance || payment > compare) {
        qualify = false;
    } //default value for qulaify is true

    //solve for interest or amount forgiven (if it qualifies)
    var interest = remainingBalance(payment, r, nForgive);

    return [payment, document.getElementById("ibr").value, interest[0], qualify, interest[1]];
    //displayResults(payment, document.getElementById("ibr").value, interest, qualify);
}

function payeCalc() {
    //solve for PAYE payment options.
    //PAYE = (10% (AGI - 150% * Poverty Line) / 12
    var payment = (0.10*(AGI-(1.5*povertyBaseline)))/12;

    //client will not qualify for PAYE if either:
    //  1. their PAYE payment is greater than the standard 10 year payment
    //  2. Or, their annual household income is greater than their total debt
    var qualify = true;
    var compare = (r*totalBalance)/(1-Math.pow((1+r),-120));
    if (AGI > totalBalance || payment > compare) {
        qualify = false;
    } //default value for qulaify is true

    //solve for interest
    var interest = remainingBalance(payment, r, nForgive);

    return [payment, document.getElementById("paye").value, interest[0], qualify, interest[1]];
    //displayResults(payment, document.getElementById("paye").value, interest, qualify);
}

function icrCalc() {
    //solve for ICR payment options.
    //ICR = (20% (AGI - 150% * Poverty Line) / 12

    var payment = (0.20*(AGI-(1.5*povertyBaseline)))/12;

    //client will not qualify for ICR if either:
    //  1. their ICR payment is greater than the standard 10 year payment
    //  2. Or, their annual household income is greater than their total debt
    var qualify = true;
    var compare = (r*totalBalance)/(1-Math.pow((1+r),-120));
    if (AGI > totalBalance || payment > compare) {
        qualify = false;
    } //default value for qulaify is true

    //solve for interest
    var interest = remainingBalance(payment, r, nForgive);

    return [payment, document.getElementById("icr").value, interest[0], qualify, interest[1]];
    //displayResults(payment, document.getElementById("icr").value, interest, qualify);
}

function remainingBalance(p, r, n) {
    //calculate remaining balance at time n
    var remainingBalance = (totalBalance*Math.pow((1+r),n))-(p*(((Math.pow((1+r),n))-1)/r));

    //if balance at time n > 0, then that amount is forgiven (return as negative number)
    //if not, calculate total interest paid as sum of payments - totalBalance
    if (remainingBalance > 0) {
        return [-remainingBalance, nForgive];
    }

    //if balance would be paid off before forgiveness, solve for when it will be paid off
    var nActual = (-Math.log(1-((r*totalBalance)/p)))/(Math.log(1+r));

    //then, calculate total paid given the time until it was paid off
    return [(nActual*p)-totalBalance, nActual];
}

function printPage() {
    window.print();
}

/*
Tooltips / side panel info stuff

IBR
IBR is available only to all borrowers of federal student loans. The amount of the monthly payment is 15% of the amount of your Adjusted Gross Income that exceeds 150% of poverty level.

PAYE
PAYE is only available to borrowers of Federal Direct loans who, prior to October 1, 2007, had never received a federal student loan, and who received a loan disbursement after October 1, 2011. The amount of the monthly payment is 10% of the amount of your Adjusted Gross Income that exceeds 150% of poverty level.

ICR
ICR is similar to PAYE and only available to borrowers of Federal Direct loans.  ICR uses a more complicated formula that more closely approximates a monthly payment that is 20% of the amount of your Adjusted Gross Income that exceeds 150% of poverty level. The payment plan was the first such “income based” repayment plan, and is seldom used anymore. PAYE and IBR are both more advantageous to the vast majority of borrowers and particularly more recent borrower of federal student loans.

*/

function displayAsText() {
    //clear output before starting
    document.getElementById("output").innerHTML = "";

    if (document.getElementById("ten").checked) {
        displayResults(results.stdLevel[0], results.stdLevel[1], results.stdLevel[2], results.stdLevel[3]);
    }

    if (document.getElementById("stdGraduated").checked) {
        displayResults(results.stdGrad[0], results.stdGrad[1], results.stdGrad[2], results.stdGrad[3]);
    }

    if (document.getElementById("twentyFive").checked) {
        displayResults(results.extLevel[0], results.extLevel[1], results.extLevel[2], results.extLevel[3]);
    }

    if (document.getElementById("extGraduated").checked) {
        displayResults(results.extGrad[0], results.extGrad[1], results.extGrad[2], results.extGrad[3]);
    }

    if (document.getElementById("ibr").checked) {
        displayResults(results.ibr[0], results.ibr[1], results.ibr[2], results.ibr[3]);
    }

    if (document.getElementById("paye").checked) {
        displayResults(results.paye[0], results.paye[1], results.paye[2], results.paye[3]);
    }

    if (document.getElementById("icr").checked) {
        displayResults(results.icr[0], results.icr[1], results.icr[2], results.icr[3]);
    }
}

function displayResults(payment, option, interest, qualify, period) {
    //creates uniformly formatted results for any given payment option
    var newOutput = document.createElement("h4");
    document.getElementById("output").appendChild(newOutput);
    var title = document.createTextNode(option + " Payment Plan Summary");
    newOutput.appendChild(title);

    var resultList = document.createElement("ul");
    newOutput.appendChild(resultList);

    //check to see if client qualifies for payment plan
    if (qualify === false) {
        var listQualification = document.createElement("li");
        listQualification.appendChild(document.createTextNode("It looks like you're making too much money to qualify for the " + option + " option, which is good news I suppose, so keep up the great work!"));
        resultList.appendChild(listQualification);
        return;
    }

    //bullet for monthly payment
    if (typeof payment === "number") {
        var listPayment = document.createElement("li");
        var paymentString = "Your monthly payments on the " + option + " plan would be about " + roundedCurrency(payment);
        if (document.getElementById("ibr").value === option || document.getElementById("paye").value === option || document.getElementById("icr").value === option) {
            paymentString += " and increase as your income increases.";
        } else {
            paymentString += " and would remain level for the duration of the payment period.";
        }
        listPayment.appendChild(document.createTextNode(paymentString));
        resultList.appendChild(listPayment);
    } else { //if it is not a string, then it is an array for one of the graduated payment options
        var listPayment = document.createElement("li");
        listPayment.appendChild(document.createTextNode("Your monthly payments on the " + option + " could start as low as " + roundedCurrency(payment[0]) + " and increase every 24 months to as much as " + roundedCurrency(payment[1]) + "."));
        resultList.appendChild(listPayment);
        var note1 = document.createElement("li");
        note1.appendChild(document.createTextNode("Note that the graduated payment increments can vary between lenders. Be sure to check the specifics from your loan provider."));
        resultList.appendChild(note1);
    }

    //bullet for total interest paid
    var listInterest = document.createElement("li");
    if (interest >= 0) {
        listInterest.appendChild(document.createTextNode("The total interest paid over the duration of the above repayment plan would be aproximately " + roundedCurrency(interest) + "."));
    } else {
        //print balance forgiven
        var note1 = document.createElement("li");
        note1.appendChild(document.createTextNode("Some federal student loans may qualify for forgiveness after 10 or 20 years of payments. Look into the Public Service Loan Forgiveness Program for more information."));
        resultList.appendChild(note1);
        listInterest.appendChild(document.createTextNode("At the above rate, you could qalify to have " + roundedCurrency(-interest) + " forgiven after " + nForgive + " qualifying monthly payments."));
    }
    resultList.appendChild(listInterest);

    //additional notes custom for different plans
    if (document.getElementById("ibr").value === option) {
        var note1 = document.createElement("li");
        note1.appendChild(document.createTextNode("IBR is available for all federal student loans."));
        resultList.appendChild(note1);
    }

    if (document.getElementById("paye").value === option) {
        var note1 = document.createElement("li");
        note1.appendChild(document.createTextNode("PAYE is only available to borrowers of Federal Direct loans who, prior to October 1, 2007, had never received a federal student loan, and who received a loan disbursement after October 1, 2011."));
        resultList.appendChild(note1);
    }

    if (document.getElementById("icr").value === option) {
        var note1 = document.createElement("li");
        note1.appendChild(document.createTextNode("ICR is only available to borrowers of Federal Direct loans with restrictions similar to PAYE."));
        resultList.appendChild(note1);

        var note2 = document.createElement("li");
        note2.appendChild(document.createTextNode("Both IBR and PAYE are typically more advantageous to the vast majority of borrowers and particularly more recent borrower of federal student loans."));
        resultList.appendChild(note2);
    }
}

function displayAsChart() {
    //clear output before starting
    document.getElementById("output").innerHTML = "";
        
    //establish table to print results
    var table = document.createElement("table");
    table.setAttribute("class", "resultsTable");
    table.id = "resultsTable";

    //table headings
    var row = table.insertRow(0)
    row.insertCell(0).innerHTML = "Repayment Plan";
    row.insertCell(1).innerHTML = "Payment Period";
    row.insertCell(2).innerHTML = "Monthly Payment(s)";
    row.insertCell(3).innerHTML = "Balance Forgiven";
    row.insertCell(4).innerHTML = "Total Interest Paid";

    //if loops for each checkbox to add rows where necessary
    //payment arrays are in this order: [payment, option, interest, qualify, period]
    var numRows = 1;
    //displayTable(results.stdLevel[0], results.stdLevel[1], results.stdLevel[2], results.stdLevel[3], results.stdLevel[4]);
    var payChangeTrigger = false;
    if (document.getElementById("ten").checked) {
        var newRow = table.insertRow(numRows);
        numRows++;
        newRow.insertCell(0).appendChild(document.createTextNode(results.stdLevel[1]));
        newRow.insertCell(1).appendChild(document.createTextNode("10 years"));
        newRow.insertCell(2).appendChild(document.createTextNode(roundedCurrency(results.stdLevel[0])));
        newRow.insertCell(3).appendChild(document.createTextNode("n/a"));
        newRow.insertCell(4).appendChild(document.createTextNode(roundedCurrency(results.stdLevel[2])));
    }

    if (document.getElementById("stdGraduated").checked) {
        var newRow = table.insertRow(numRows);
        numRows++;
        newRow.insertCell(0).appendChild(document.createTextNode(results.stdGrad[1]));
        newRow.insertCell(1).appendChild(document.createTextNode("10 years"));
        newRow.insertCell(2).appendChild(document.createTextNode(roundedCurrency(results.stdGrad[0][0])+" - "+roundedCurrency(results.stdGrad[0][1])));
        newRow.insertCell(3).appendChild(document.createTextNode("n/a"));
        newRow.insertCell(4).appendChild(document.createTextNode(roundedCurrency(results.stdGrad[2])));
    }

    if (document.getElementById("twentyFive").checked) {
        var newRow = table.insertRow(numRows);
        numRows++;
        newRow.insertCell(0).appendChild(document.createTextNode(results.extLevel[1]));
        newRow.insertCell(1).appendChild(document.createTextNode("25 years"));
        newRow.insertCell(2).appendChild(document.createTextNode(roundedCurrency(results.extLevel[0])));
        newRow.insertCell(3).appendChild(document.createTextNode("n/a"));
        newRow.insertCell(4).appendChild(document.createTextNode(roundedCurrency(results.extLevel[2])));
    }

    if (document.getElementById("extGraduated").checked) {
        var newRow = table.insertRow(numRows);
        numRows++;
        newRow.insertCell(0).appendChild(document.createTextNode(results.extGrad[1]));
        newRow.insertCell(1).appendChild(document.createTextNode("25 years"));
        newRow.insertCell(2).appendChild(document.createTextNode(roundedCurrency(results.extGrad[0][0])+" - "+roundedCurrency(results.extGrad[0][1])));
        newRow.insertCell(3).appendChild(document.createTextNode("n/a"));
        newRow.insertCell(4).appendChild(document.createTextNode(roundedCurrency(results.extGrad[2])));
    }

    if (document.getElementById("ibr").checked) {
        var newRow = table.insertRow(numRows);
        numRows++;
        newRow.insertCell(0).appendChild(document.createTextNode(results.ibr[1]));
        newRow.insertCell(1).appendChild(document.createTextNode(Math.min(nForgive/12,Math.round(results.ibr[4]/12)) + " years"));
        newRow.insertCell(2).appendChild(document.createTextNode(roundedCurrency(results.ibr[0]) + "*"));
        if (results.ibr[2] < 0) {
            newRow.insertCell(3).appendChild(document.createTextNode(roundedCurrency(Math.abs(results.ibr[2]))));
            newRow.insertCell(4).appendChild(document.createTextNode("n/a"));
        } else {
            newRow.insertCell(3).appendChild(document.createTextNode("n/a"));
            newRow.insertCell(4).appendChild(document.createTextNode(roundedCurrency(results.ibr[2])));
        }
        payChangeTrigger = true;
    }

    if (document.getElementById("paye").checked) {
        var newRow = table.insertRow(numRows);
        numRows++;
        newRow.insertCell(0).appendChild(document.createTextNode(results.paye[1]));
        newRow.insertCell(1).appendChild(document.createTextNode(Math.min(nForgive/12,Math.round(results.paye[4]/12)) + " years"));
        newRow.insertCell(2).appendChild(document.createTextNode(roundedCurrency(results.paye[0]) + "*"));
        if (results.paye[2] < 0) {
            newRow.insertCell(3).appendChild(document.createTextNode(roundedCurrency(Math.abs(results.paye[2]))));
            newRow.insertCell(4).appendChild(document.createTextNode("n/a"));
        } else {
            newRow.insertCell(3).appendChild(document.createTextNode("n/a"));
            newRow.insertCell(4).appendChild(document.createTextNode(roundedCurrency(results.paye[2])));
        }
        payChangeTrigger = true;
    }

    if (document.getElementById("icr").checked) {
        var newRow = table.insertRow(numRows);
        numRows++;
        newRow.insertCell(0).appendChild(document.createTextNode(results.icr[1]));
        newRow.insertCell(1).appendChild(document.createTextNode(Math.min(nForgive/12,Math.round(results.icr[4]/12)) + " years"));
        newRow.insertCell(2).appendChild(document.createTextNode(roundedCurrency(results.icr[0]) + "*"));
        if (results.icr[2] < 0) {
            newRow.insertCell(3).appendChild(document.createTextNode(roundedCurrency(Math.abs(results.icr[2]))));
            newRow.insertCell(4).appendChild(document.createTextNode("n/a"));
        } else {
            newRow.insertCell(3).appendChild(document.createTextNode("n/a"));
            newRow.insertCell(4).appendChild(document.createTextNode(roundedCurrency(results.icr[2])));
        }
        payChangeTrigger = true;
    }

    document.getElementById("output").appendChild(table);

    if (payChangeTrigger) {
        document.getElementById("output").appendChild(document.createTextNode("*Monthly payments will increase as your income increases."));
    }
}
