/* =====================================================================
   M&A VALUATION LAB — CALCULATOR LOGIC
   ---------------------------------------------------------------------
   Only calculators.html loads this file. It is organised like this:

     PART 1. Shared helpers (number formatting, reading inputs, errors)
     PART 2. The six calculators. Each one has TWO functions:
               - a "calculate..." function: PURE MATHS. It takes numbers
                 and returns results. It never touches the web page.
               - a "handle..." function: reads the inputs, checks them,
                 calls the maths function and shows the results.
             Keeping maths and page code apart makes both easier to read
             and lets you test the maths on its own.
     PART 3. Football field chart drawing (HTML <canvas>)
     PART 4. Start-up: connect each form to its handler

   Units: money is in millions of dollars ($M) unless noted; percentages
   are typed as whole numbers (10 means 10%) and converted to decimals
   (0.10) before doing maths.
   ===================================================================== */


/* =====================================================================
   PART 1. SHARED HELPERS
   ===================================================================== */

/* ---------------------------------------------------------------------
   formatMoney
   WHAT: Turns a number into a nicely formatted dollar string.
           formatMoney(1250)          -> "$1,250.0M"
           formatMoney(-50)           -> "-$50.0M"
           formatMoney(28.7125, "")   -> "$28.71"   (per-share amounts)
           formatMoney(800, "M", 0)   -> "$800M"    (chart axis labels)
   WHY:  Using ONE function for every money amount keeps the whole
         site consistent. Change it here and every result changes.
   - unit: text after the number ("M" for millions, "" for none)
   - decimals: digits after the decimal point (default: 1 for millions,
               2 for plain dollars)
   --------------------------------------------------------------------- */
function formatMoney(amount, unit = "M", decimals) {
  if (decimals === undefined) {
    decimals = unit === "M" ? 1 : 2;
  }

  // Put the minus sign before the "$" (e.g. -$50.0M, not $-50.0M).
  const sign = amount < 0 ? "-" : "";

  // toLocaleString adds thousands separators: 1250 -> "1,250.0"
  const digits = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return sign + "$" + digits + unit;
}

/* ---------------------------------------------------------------------
   formatPercent
   WHAT: Turns a decimal into a percentage string: 0.0816 -> "8.16%".
   WHY:  Maths uses decimals, but people read percentages.
   --------------------------------------------------------------------- */
function formatPercent(decimalValue, decimals = 2) {
  return (decimalValue * 100).toFixed(decimals) + "%";
}

/* ---------------------------------------------------------------------
   formatMultiple
   WHAT: Formats a valuation multiple: 9.75 -> "9.75x".
   --------------------------------------------------------------------- */
function formatMultiple(value) {
  return value.toFixed(2) + "x";
}

/* ---------------------------------------------------------------------
   readNumber
   WHAT: Gets the number typed into the input with the given id.
         Returns NaN ("Not a Number") if the box is empty or invalid.
   WHY:  Input boxes always give back text, even type="number" ones,
         so we convert it. NaN lets us detect empty boxes later.
   --------------------------------------------------------------------- */
function readNumber(inputId) {
  const text = document.getElementById(inputId).value.trim();
  if (text === "") {
    return NaN;
  }
  return Number(text);
}

/* ---------------------------------------------------------------------
   isMissing
   WHAT: True if a value is not a usable number (empty or invalid).
   --------------------------------------------------------------------- */
function isMissing(value) {
  return Number.isNaN(value);
}

/* ---------------------------------------------------------------------
   showError
   WHAT: Replaces a results area with a friendly red error message.
   WHY:  Telling people what to fix is better than showing "NaN".
         textContent (not innerHTML) is used so the message is always
         shown as plain text.
   --------------------------------------------------------------------- */
function showError(resultsElement, message) {
  resultsElement.innerHTML = "";
  const errorBox = document.createElement("p");
  errorBox.className = "error-message";
  errorBox.textContent = "⚠️ " + message;
  resultsElement.appendChild(errorBox);
}

/* ---------------------------------------------------------------------
   resultItem
   WHAT: Builds the HTML for one result "tile" (small label, big value).
   WHY:  All calculators show results the same way; this avoids
         repeating the same HTML six times.
   --------------------------------------------------------------------- */
function resultItem(label, value) {
  return (
    '<div class="result-item">' +
      '<span class="result-label">' + label + "</span>" +
      '<span class="result-value">' + value + "</span>" +
    "</div>"
  );
}

/* ---------------------------------------------------------------------
   findMedian
   WHAT: Returns the middle value of a list of numbers. With an even
         count, it averages the two middle numbers.
           findMedian([8, 9.5, 10, 11.5]) -> 9.75
   --------------------------------------------------------------------- */
function findMedian(numbers) {
  // Copy, then sort from smallest to largest (a - b sorts numerically).
  const sorted = numbers.slice().sort(function (a, b) { return a - b; });
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}


/* =====================================================================
   PART 2A. DCF CALCULATOR
   ===================================================================== */

/* ---------------------------------------------------------------------
   calculateDcf (pure maths)
   WHAT: Discounts 5 years of cash flow plus a terminal value back to
         today, then converts enterprise value into equity value.
   INPUT: cashFlows = [year1, ..., year5] in $M; wacc and growth as
          decimals (0.10 = 10%); netDebt in $M; shares in millions.
   OUTPUT: an object with every intermediate number, so the page can
           show the year-by-year table.
   --------------------------------------------------------------------- */
function calculateDcf(cashFlows, wacc, growth, netDebt, shares) {
  const yearRows = [];
  let sumOfPresentValues = 0;

  // Discount each year's cash flow: PV = FCF / (1 + WACC)^year
  cashFlows.forEach(function (cashFlow, index) {
    const year = index + 1;
    const discountFactor = 1 / Math.pow(1 + wacc, year);
    const presentValue = cashFlow * discountFactor;

    yearRows.push({ year: year, cashFlow: cashFlow, discountFactor: discountFactor, presentValue: presentValue });
    sumOfPresentValues = sumOfPresentValues + presentValue;
  });

  // Terminal value with the Gordon growth formula, based on the last year.
  const lastYear = cashFlows.length;
  const lastCashFlow = cashFlows[lastYear - 1];
  const terminalValue = (lastCashFlow * (1 + growth)) / (wacc - growth);

  // The terminal value is "as of" the end of the last year, so discount it too.
  const presentValueOfTerminal = terminalValue / Math.pow(1 + wacc, lastYear);

  const enterpriseValue = sumOfPresentValues + presentValueOfTerminal;
  const equityValue = enterpriseValue - netDebt;
  const valuePerShare = equityValue / shares;

  return {
    yearRows: yearRows,
    sumOfPresentValues: sumOfPresentValues,
    terminalValue: terminalValue,
    presentValueOfTerminal: presentValueOfTerminal,
    terminalShareOfValue: presentValueOfTerminal / enterpriseValue,
    enterpriseValue: enterpriseValue,
    equityValue: equityValue,
    valuePerShare: valuePerShare,
  };
}

/* ---------------------------------------------------------------------
   handleDcfCalculate (page code)
   WHAT: Runs when the DCF form is submitted: reads inputs, validates,
         calls calculateDcf and displays results + year-by-year table.
   --------------------------------------------------------------------- */
function handleDcfCalculate(event) {
  // Stop the browser from reloading the page (the default for forms).
  event.preventDefault();
  const results = document.getElementById("dcf-results");

  // Read the 5 cash flows from inputs dcf-fcf-1 ... dcf-fcf-5.
  const cashFlows = [];
  for (let year = 1; year <= 5; year++) {
    cashFlows.push(readNumber("dcf-fcf-" + year));
  }
  const waccPercent = readNumber("dcf-wacc");
  const growthPercent = readNumber("dcf-growth");
  const netDebt = readNumber("dcf-net-debt");
  const shares = readNumber("dcf-shares");

  // --- Validation: stop with a friendly message if anything is wrong ---
  if (cashFlows.some(isMissing)) {
    return showError(results, "Please enter a free cash flow for all 5 years.");
  }
  if (isMissing(waccPercent) || isMissing(growthPercent)) {
    return showError(results, "Please enter both the WACC and the terminal growth rate.");
  }
  if (waccPercent <= 0) {
    return showError(results, "WACC must be greater than 0%.");
  }
  if (waccPercent <= growthPercent) {
    return showError(results, "Discount rate (WACC) must be higher than the terminal growth rate. Otherwise the terminal value would be infinite.");
  }
  if (isMissing(netDebt)) {
    return showError(results, "Please enter net debt (use 0 if none, or a negative number for net cash).");
  }
  if (isMissing(shares) || shares <= 0) {
    return showError(results, "Shares outstanding must be greater than 0.");
  }

  // --- Maths ---
  const dcf = calculateDcf(cashFlows, waccPercent / 100, growthPercent / 100, netDebt, shares);

  // --- Build the year-by-year table rows ---
  let tableRows = "";
  dcf.yearRows.forEach(function (row) {
    tableRows +=
      "<tr>" +
        "<td>Year " + row.year + "</td>" +
        '<td class="number">' + formatMoney(row.cashFlow) + "</td>" +
        '<td class="number">' + row.discountFactor.toFixed(4) + "</td>" +
        '<td class="number">' + formatMoney(row.presentValue) + "</td>" +
      "</tr>";
  });
  // Add the terminal value as the last row (discounted with the year-5 factor).
  const lastFactor = dcf.yearRows[dcf.yearRows.length - 1].discountFactor;
  tableRows +=
    "<tr>" +
      "<td>Terminal value</td>" +
      '<td class="number">' + formatMoney(dcf.terminalValue) + "</td>" +
      '<td class="number">' + lastFactor.toFixed(4) + "</td>" +
      '<td class="number">' + formatMoney(dcf.presentValueOfTerminal) + "</td>" +
    "</tr>";

  // --- Show everything ---
  results.innerHTML =
    '<div class="result-grid">' +
      resultItem("Enterprise value", formatMoney(dcf.enterpriseValue)) +
      resultItem("Equity value", formatMoney(dcf.equityValue)) +
      resultItem("Value per share", formatMoney(dcf.valuePerShare, "")) +
      resultItem("Terminal value share of EV", formatPercent(dcf.terminalShareOfValue, 1)) +
    "</div>" +
    '<div class="table-wrapper"><table class="data-table">' +
      "<thead><tr><th>Period</th><th>Cash flow</th><th>Discount factor</th><th>Present value</th></tr></thead>" +
      "<tbody>" + tableRows + "</tbody>" +
      "<tfoot><tr><td>Enterprise value</td><td></td><td></td>" +
        '<td class="number">' + formatMoney(dcf.enterpriseValue) + "</td></tr></tfoot>" +
    "</table></div>";

  // A gentle warning if the equity value is negative (debt bigger than EV).
  if (dcf.equityValue < 0) {
    results.innerHTML += '<p class="verdict verdict-bad">Net debt is larger than enterprise value, so the shares would be worth nothing.</p>';
  }
}


/* =====================================================================
   PART 2B. WACC CALCULATOR
   ===================================================================== */

/* ---------------------------------------------------------------------
   calculateCostOfEquityCapm (pure maths)
   WHAT: CAPM: cost of equity = risk-free rate + beta × market premium.
   All rates are decimals.
   --------------------------------------------------------------------- */
function calculateCostOfEquityCapm(riskFreeRate, beta, marketRiskPremium) {
  return riskFreeRate + beta * marketRiskPremium;
}

/* ---------------------------------------------------------------------
   calculateWacc (pure maths)
   WHAT: Blends the cost of equity and the after-tax cost of debt,
         weighted by how much equity and debt the company has.
   --------------------------------------------------------------------- */
function calculateWacc(equityValue, debtValue, costOfEquity, costOfDebt, taxRate) {
  const totalCapital = equityValue + debtValue;
  const equityWeight = equityValue / totalCapital;
  const debtWeight = debtValue / totalCapital;
  const afterTaxCostOfDebt = costOfDebt * (1 - taxRate);
  const wacc = equityWeight * costOfEquity + debtWeight * afterTaxCostOfDebt;

  return {
    equityWeight: equityWeight,
    debtWeight: debtWeight,
    afterTaxCostOfDebt: afterTaxCostOfDebt,
    wacc: wacc,
  };
}

/* ---------------------------------------------------------------------
   updateCapmInputs (page code)
   WHAT: Greys out whichever cost-of-equity inputs are NOT being used,
         depending on the "Calculate with CAPM" checkbox.
   WHY:  Makes it obvious which numbers actually affect the result.
   --------------------------------------------------------------------- */
function updateCapmInputs() {
  const useCapm = document.getElementById("wacc-use-capm").checked;
  document.getElementById("wacc-cost-of-equity").disabled = useCapm;
  document.getElementById("wacc-risk-free").disabled = !useCapm;
  document.getElementById("wacc-beta").disabled = !useCapm;
  document.getElementById("wacc-market-premium").disabled = !useCapm;
}

/* ---------------------------------------------------------------------
   handleWaccCalculate (page code)
   --------------------------------------------------------------------- */
function handleWaccCalculate(event) {
  event.preventDefault();
  const results = document.getElementById("wacc-results");

  const equityValue = readNumber("wacc-equity");
  const debtValue = readNumber("wacc-debt");
  const costOfDebtPercent = readNumber("wacc-cost-of-debt");
  const taxPercent = readNumber("wacc-tax");
  const useCapm = document.getElementById("wacc-use-capm").checked;

  // --- Validation ---
  if (isMissing(equityValue) || isMissing(debtValue)) {
    return showError(results, "Please enter both equity value and debt value.");
  }
  if (equityValue < 0 || debtValue < 0) {
    return showError(results, "Equity and debt values can't be negative.");
  }
  if (equityValue + debtValue === 0) {
    return showError(results, "Equity and debt can't both be zero.");
  }
  if (isMissing(costOfDebtPercent)) {
    return showError(results, "Please enter the cost of debt.");
  }
  if (isMissing(taxPercent) || taxPercent < 0 || taxPercent >= 100) {
    return showError(results, "Tax rate must be between 0% and 100%.");
  }

  // --- Work out the cost of equity, either via CAPM or typed directly ---
  let costOfEquity;
  if (useCapm) {
    const riskFreePercent = readNumber("wacc-risk-free");
    const beta = readNumber("wacc-beta");
    const marketPremiumPercent = readNumber("wacc-market-premium");
    if (isMissing(riskFreePercent) || isMissing(beta) || isMissing(marketPremiumPercent)) {
      return showError(results, "Please fill in the risk-free rate, beta and market risk premium (or untick CAPM).");
    }
    costOfEquity = calculateCostOfEquityCapm(riskFreePercent / 100, beta, marketPremiumPercent / 100);
  } else {
    const costOfEquityPercent = readNumber("wacc-cost-of-equity");
    if (isMissing(costOfEquityPercent)) {
      return showError(results, "Please enter a cost of equity (or tick CAPM to calculate it).");
    }
    costOfEquity = costOfEquityPercent / 100;
  }

  // --- Maths ---
  const result = calculateWacc(equityValue, debtValue, costOfEquity, costOfDebtPercent / 100, taxPercent / 100);

  // --- Show results ---
  results.innerHTML =
    '<div class="result-grid">' +
      resultItem("WACC", formatPercent(result.wacc)) +
      resultItem("Cost of equity", formatPercent(costOfEquity)) +
      resultItem("After-tax cost of debt", formatPercent(result.afterTaxCostOfDebt)) +
      resultItem("Equity / Debt weights", formatPercent(result.equityWeight, 1) + " / " + formatPercent(result.debtWeight, 1)) +
    "</div>";
}


/* =====================================================================
   PART 2C. COMPARABLE MULTIPLES CALCULATOR
   ===================================================================== */

/* ---------------------------------------------------------------------
   calculateImpliedRange (pure maths)
   WHAT: Given a target figure (e.g. EBITDA of 80) and a list of peer
         multiples (e.g. [8, 9.5, 10, 11.5]), returns the low, median
         and high multiples AND the implied values (figure × multiple).
   --------------------------------------------------------------------- */
function calculateImpliedRange(targetFigure, multiples) {
  const lowMultiple = Math.min.apply(null, multiples);
  const highMultiple = Math.max.apply(null, multiples);
  const medianMultiple = findMedian(multiples);

  return {
    lowMultiple: lowMultiple,
    medianMultiple: medianMultiple,
    highMultiple: highMultiple,
    lowValue: targetFigure * lowMultiple,
    medianValue: targetFigure * medianMultiple,
    highValue: targetFigure * highMultiple,
  };
}

/* ---------------------------------------------------------------------
   readPeerMultiples (page code)
   WHAT: Collects the multiples typed for peers 1–4 for one column
         ("ebitda" or "revenue"), skipping empty boxes.
   RETURNS: an array of numbers, or null if a box holds a bad value.
   --------------------------------------------------------------------- */
function readPeerMultiples(columnName) {
  const multiples = [];
  for (let peer = 1; peer <= 4; peer++) {
    const value = readNumber("peer-" + columnName + "-" + peer);
    if (isMissing(value)) {
      continue; // Empty box: skip this peer.
    }
    if (value <= 0) {
      return null; // Multiples must be positive.
    }
    multiples.push(value);
  }
  return multiples;
}

/* ---------------------------------------------------------------------
   comparisonRow
   WHAT: Builds one table row for the multiples results table.
   --------------------------------------------------------------------- */
function comparisonRow(label, range) {
  return (
    "<tr>" +
      "<td>" + label + "</td>" +
      '<td class="number">' + formatMultiple(range.lowMultiple) + "<br>" + formatMoney(range.lowValue) + "</td>" +
      '<td class="number">' + formatMultiple(range.medianMultiple) + "<br>" + formatMoney(range.medianValue) + "</td>" +
      '<td class="number">' + formatMultiple(range.highMultiple) + "<br>" + formatMoney(range.highValue) + "</td>" +
    "</tr>"
  );
}

/* ---------------------------------------------------------------------
   handleCompsCalculate (page code)
   --------------------------------------------------------------------- */
function handleCompsCalculate(event) {
  event.preventDefault();
  const results = document.getElementById("comps-results");

  const targetEbitda = readNumber("comps-ebitda");
  const targetRevenue = readNumber("comps-revenue");
  const ebitdaMultiples = readPeerMultiples("ebitda");
  const revenueMultiples = readPeerMultiples("revenue");

  // --- Validation ---
  if (ebitdaMultiples === null || revenueMultiples === null) {
    return showError(results, "Peer multiples must be positive numbers. Leave a box empty to skip it.");
  }
  if (ebitdaMultiples.length === 0 && revenueMultiples.length === 0) {
    return showError(results, "Please enter at least one peer multiple.");
  }
  if (ebitdaMultiples.length > 0 && (isMissing(targetEbitda) || targetEbitda <= 0)) {
    return showError(results, "Target EBITDA must be greater than 0 to use EV/EBITDA multiples.");
  }
  if (revenueMultiples.length > 0 && (isMissing(targetRevenue) || targetRevenue <= 0)) {
    return showError(results, "Target revenue must be greater than 0 to use EV/Revenue multiples.");
  }

  // --- Maths + table rows (only for columns that have multiples) ---
  let tableRows = "";
  if (ebitdaMultiples.length > 0) {
    tableRows += comparisonRow("EV / EBITDA", calculateImpliedRange(targetEbitda, ebitdaMultiples));
  }
  if (revenueMultiples.length > 0) {
    tableRows += comparisonRow("EV / Revenue", calculateImpliedRange(targetRevenue, revenueMultiples));
  }

  // --- Show results ---
  results.innerHTML =
    '<p class="muted">Each cell shows the multiple, then the implied enterprise value.</p>' +
    '<div class="table-wrapper"><table class="data-table">' +
      "<thead><tr><th>Multiple</th><th>Low</th><th>Median</th><th>High</th></tr></thead>" +
      "<tbody>" + tableRows + "</tbody>" +
    "</table></div>" +
    '<p class="muted">Tip: EV multiples give <strong>enterprise</strong> value. Subtract net debt to get equity value.</p>';
}


/* =====================================================================
   PART 2D. SYNERGY & OFFER PRICE CALCULATOR
   ===================================================================== */

/* ---------------------------------------------------------------------
   calculateOfferAnalysis (pure maths)
   WHAT: Works out the maximum sensible price and how the value created
         by the deal is split between the buyer and the seller.
   INPUT: probability and premium as decimals (0.75, 0.20).
   --------------------------------------------------------------------- */
function calculateOfferAnalysis(standaloneValue, synergies, probability, integrationCosts, premium) {
  const riskAdjustedSynergies = synergies * probability;
  const netSynergies = riskAdjustedSynergies - integrationCosts;
  const maximumPrice = standaloneValue + netSynergies;
  const offerPrice = standaloneValue * (1 + premium);

  // The premium paid is value transferred to the seller's shareholders.
  const valueToSeller = offerPrice - standaloneValue;
  // What's left of the net synergies stays with the buyer (can be negative).
  const valueToBuyer = maximumPrice - offerPrice;

  return {
    riskAdjustedSynergies: riskAdjustedSynergies,
    netSynergies: netSynergies,
    maximumPrice: maximumPrice,
    offerPrice: offerPrice,
    valueToSeller: valueToSeller,
    valueToBuyer: valueToBuyer,
  };
}

/* ---------------------------------------------------------------------
   handleSynergyCalculate (page code)
   --------------------------------------------------------------------- */
function handleSynergyCalculate(event) {
  event.preventDefault();
  const results = document.getElementById("synergy-results");

  const standaloneValue = readNumber("synergy-standalone");
  const synergies = readNumber("synergy-amount");
  const probabilityPercent = readNumber("synergy-probability");
  const integrationCosts = readNumber("synergy-integration");
  const premiumPercent = readNumber("synergy-premium");

  // --- Validation ---
  if ([standaloneValue, synergies, probabilityPercent, integrationCosts, premiumPercent].some(isMissing)) {
    return showError(results, "Please fill in all five boxes.");
  }
  if (standaloneValue <= 0) {
    return showError(results, "Standalone value must be greater than 0.");
  }
  if (synergies < 0 || integrationCosts < 0) {
    return showError(results, "Synergies and integration costs can't be negative.");
  }
  if (probabilityPercent < 0 || probabilityPercent > 100) {
    return showError(results, "Probability must be between 0% and 100%.");
  }
  if (premiumPercent < 0) {
    return showError(results, "Control premium can't be negative.");
  }

  // --- Maths ---
  const deal = calculateOfferAnalysis(
    standaloneValue, synergies, probabilityPercent / 100, integrationCosts, premiumPercent / 100
  );

  // --- Verdict: is the offer below the maximum sensible price? ---
  let verdict;
  if (deal.valueToBuyer >= 0) {
    // Share of net synergies each side keeps (only meaningful if net synergies > 0).
    const sellerShare = deal.netSynergies > 0 ? deal.valueToSeller / deal.netSynergies : 0;
    verdict =
      '<p class="verdict verdict-good">✔ The offer is below the maximum sensible price. ' +
      "The seller receives " + formatPercent(sellerShare, 0) + " of the net synergies and the buyer keeps " +
      formatPercent(1 - sellerShare, 0) + ".</p>";
  } else {
    verdict =
      '<p class="verdict verdict-bad">✘ Overpaying: the offer is ' + formatMoney(-deal.valueToBuyer) +
      " above the maximum sensible price. The buyer's shareholders would lose value.</p>";
  }

  // --- Show results ---
  results.innerHTML =
    '<div class="result-grid">' +
      resultItem("Maximum sensible price", formatMoney(deal.maximumPrice)) +
      resultItem("Offer price", formatMoney(deal.offerPrice)) +
      resultItem("Risk-adjusted synergies", formatMoney(deal.riskAdjustedSynergies)) +
      resultItem("Net synergies (value created)", formatMoney(deal.netSynergies)) +
      resultItem("Value to seller (premium)", formatMoney(deal.valueToSeller)) +
      resultItem("Value to buyer", formatMoney(deal.valueToBuyer)) +
    "</div>" +
    verdict;
}


/* =====================================================================
   PART 2E. ACCRETION / DILUTION CALCULATOR
   ===================================================================== */

/* ---------------------------------------------------------------------
   calculateAccretionDilution (pure maths)
   WHAT: Estimates the buyer's earnings per share after the deal.
         The stock part is paid with new shares; the cash part is paid
         with new debt, which costs interest (reduced by tax savings).
   INPUT: an object with named values; percentages as decimals.
   --------------------------------------------------------------------- */
function calculateAccretionDilution(inputs) {
  const buyerNetIncome = inputs.buyerEps * inputs.buyerShares;

  // Split the price into the part paid in stock and the part paid in cash.
  const stockPaid = inputs.purchasePrice * inputs.stockShare;
  const cashPaid = inputs.purchasePrice - stockPaid;

  // Stock: how many new buyer shares must be issued?
  const newShares = stockPaid / inputs.sharePrice;

  // Cash: borrowed, so the buyer pays interest (after the tax saving).
  const afterTaxInterest = cashPaid * inputs.interestRate * (1 - inputs.taxRate);

  const proFormaNetIncome = buyerNetIncome + inputs.targetNetIncome - afterTaxInterest;
  const proFormaShares = inputs.buyerShares + newShares;
  const proFormaEps = proFormaNetIncome / proFormaShares;
  const epsChange = proFormaEps / inputs.buyerEps - 1;

  return {
    buyerNetIncome: buyerNetIncome,
    stockPaid: stockPaid,
    cashPaid: cashPaid,
    newShares: newShares,
    afterTaxInterest: afterTaxInterest,
    proFormaNetIncome: proFormaNetIncome,
    proFormaShares: proFormaShares,
    proFormaEps: proFormaEps,
    epsChange: epsChange,
  };
}

/* ---------------------------------------------------------------------
   handleAccretionCalculate (page code)
   --------------------------------------------------------------------- */
function handleAccretionCalculate(event) {
  event.preventDefault();
  const results = document.getElementById("accretion-results");

  const inputs = {
    buyerEps: readNumber("acc-buyer-eps"),
    buyerShares: readNumber("acc-buyer-shares"),
    targetNetIncome: readNumber("acc-target-income"),
    purchasePrice: readNumber("acc-price"),
    stockShare: readNumber("acc-stock-percent") / 100,
    sharePrice: readNumber("acc-share-price"),
    interestRate: readNumber("acc-interest") / 100,
    taxRate: readNumber("acc-tax") / 100,
  };

  // --- Validation ---
  // Object.values gives a list of all the numbers so we can check them at once.
  if (Object.values(inputs).some(isMissing)) {
    return showError(results, "Please fill in all eight boxes.");
  }
  if (inputs.buyerEps <= 0) {
    return showError(results, "Buyer EPS must be greater than 0 for this simple test.");
  }
  if (inputs.buyerShares <= 0 || inputs.sharePrice <= 0) {
    return showError(results, "Buyer shares and share price must be greater than 0.");
  }
  if (inputs.purchasePrice <= 0) {
    return showError(results, "Purchase price must be greater than 0.");
  }
  if (inputs.stockShare < 0 || inputs.stockShare > 1) {
    return showError(results, "% paid in stock must be between 0% and 100%.");
  }
  if (inputs.taxRate < 0 || inputs.taxRate >= 1) {
    return showError(results, "Tax rate must be between 0% and 100%.");
  }
  if (inputs.interestRate < 0) {
    return showError(results, "Interest rate can't be negative.");
  }

  // --- Maths ---
  const deal = calculateAccretionDilution(inputs);

  // --- Verdict ---
  // Tiny differences (under 0.005%) count as "break-even".
  let verdict;
  if (Math.abs(deal.epsChange) < 0.00005) {
    verdict = '<p class="verdict verdict-good">≈ Break-even: EPS is unchanged.</p>';
  } else if (deal.epsChange > 0) {
    verdict = '<p class="verdict verdict-good">✔ ACCRETIVE: EPS rises by ' + formatPercent(deal.epsChange) + ".</p>";
  } else {
    verdict = '<p class="verdict verdict-bad">✘ DILUTIVE: EPS falls by ' + formatPercent(-deal.epsChange) + ".</p>";
  }

  // --- Show results ---
  results.innerHTML =
    '<div class="result-grid">' +
      resultItem("Current EPS", formatMoney(inputs.buyerEps, "")) +
      resultItem("Pro forma EPS", formatMoney(deal.proFormaEps, "")) +
      resultItem("New shares issued", deal.newShares.toFixed(2) + "M") +
      resultItem("New debt", formatMoney(deal.cashPaid)) +
      resultItem("After-tax interest", formatMoney(deal.afterTaxInterest)) +
      resultItem("Pro forma net income", formatMoney(deal.proFormaNetIncome)) +
    "</div>" +
    verdict;
}


/* =====================================================================
   PART 3. FOOTBALL FIELD CHART (HTML <canvas>)
   ---------------------------------------------------------------------
   A canvas is a blank rectangle of pixels. We draw on it with commands
   like "fill a rectangle here" or "write text there", using x (pixels
   from the left) and y (pixels from the top) coordinates.
   ===================================================================== */

// Remember the last chart drawn so we can redraw it when the window
// is resized or dark mode is switched on/off.
let lastFootballRows = [];
let lastOfferPrice = NaN;

/* ---------------------------------------------------------------------
   getThemeColor
   WHAT: Reads a colour from the CSS variables in style.css.
   WHY:  The chart then matches the site theme AND dark mode, and you
         only ever change colours in one place (style.css).
   --------------------------------------------------------------------- */
function getThemeColor(variableName) {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

/* ---------------------------------------------------------------------
   chooseNiceStep
   WHAT: Picks a "round" gap between axis labels (e.g. 100, 200, 250,
         500) so the axis shows tidy numbers rather than 137.4, 274.8…
   HOW:  Aim for about "targetLabelCount" labels, then round the gap up
         to 1, 2, 2.5 or 5 times a power of ten.
   --------------------------------------------------------------------- */
function chooseNiceStep(range, targetLabelCount) {
  const roughStep = range / targetLabelCount;
  const powerOfTen = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const niceMultipliers = [1, 2, 2.5, 5, 10];

  for (const multiplier of niceMultipliers) {
    if (roughStep <= multiplier * powerOfTen) {
      return multiplier * powerOfTen;
    }
  }
  return 10 * powerOfTen;
}

/* ---------------------------------------------------------------------
   drawRoundedBar
   WHAT: Draws a filled rectangle with slightly rounded corners.
   WHY:  ctx.roundRect is not available in some older browsers, so we
         fall back to a normal square-cornered rectangle there.
   --------------------------------------------------------------------- */
function drawRoundedBar(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.fill();
}

/* ---------------------------------------------------------------------
   drawFootballField
   WHAT: Draws one horizontal bar per valuation method, from its low
         value to its high value, on a shared dollar scale, plus an
         optional dashed line for the offer price.
   INPUT: rows = [{ name: "DCF", low: 950, high: 1250 }, ...]
          offerPrice = a number, or NaN to skip the line
   --------------------------------------------------------------------- */
function drawFootballField(rows, offerPrice) {
  const canvas = document.getElementById("football-field-canvas");
  const ctx = canvas.getContext("2d"); // The "pen" we draw with.

  // ---- 1. Decide the chart's size ----
  // The canvas is as wide as its container; the height grows with the
  // number of rows (each row gets 52 pixels).
  const cssWidth = canvas.parentElement.clientWidth;
  const rowHeight = 52;
  const topMargin = 30;     // Room for the offer-price label
  const bottomMargin = 36;  // Room for the axis labels
  const cssHeight = topMargin + rows.length * rowHeight + bottomMargin;

  // Phones and "retina" screens have more pixels than CSS says
  // (devicePixelRatio is often 2 or 3). Drawing at the real pixel count
  // keeps lines and text sharp instead of blurry.
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = cssWidth * pixelRatio;
  canvas.height = cssHeight * pixelRatio;
  canvas.style.height = cssHeight + "px";
  // After this, we can draw using normal CSS pixel numbers.
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  // ---- 2. Read colours from style.css (works in dark mode too) ----
  const barColor = getThemeColor("--color-accent");
  const textColor = getThemeColor("--color-text");
  const mutedColor = getThemeColor("--color-text-muted");
  const gridColor = getThemeColor("--color-border");
  const lineColor = getThemeColor("--color-heading");

  // ---- 3. Work out the plotting area ----
  // Left column holds method names; narrower on small screens.
  const labelWidth = cssWidth < 500 ? 110 : 160;
  const rightPadding = 32; // Room so the last axis label isn't cut off
  const plotLeft = labelWidth;
  const plotWidth = cssWidth - labelWidth - rightPadding;
  const plotBottom = topMargin + rows.length * rowHeight;

  // ---- 4. Work out the value scale (min and max of the axis) ----
  const allValues = [];
  rows.forEach(function (row) {
    allValues.push(row.low, row.high);
  });
  if (!isMissing(offerPrice)) {
    allValues.push(offerPrice);
  }
  let minValue = Math.min.apply(null, allValues);
  let maxValue = Math.max.apply(null, allValues);
  if (minValue === maxValue) {
    // Avoid a zero-width scale if every number is the same.
    minValue = minValue - 1;
    maxValue = maxValue + 1;
  }
  // Allow roughly one axis label per 80 pixels so labels never overlap
  // (about 5 on a laptop, 2–3 on a phone).
  const targetLabelCount = Math.max(2, Math.floor(plotWidth / 80));
  const step = chooseNiceStep(maxValue - minValue, targetLabelCount);
  const axisMin = Math.floor(minValue / step) * step;
  const axisMax = Math.ceil(maxValue / step) * step;

  // valueToX converts a dollar value into a horizontal pixel position.
  // axisMin maps to the left edge of the plot, axisMax to the right edge.
  function valueToX(value) {
    return plotLeft + ((value - axisMin) / (axisMax - axisMin)) * plotWidth;
  }

  // ---- 5. Draw vertical grid lines and axis labels ----
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.lineWidth = 1;
  for (let value = axisMin; value <= axisMax + step / 2; value += step) {
    const x = Math.round(valueToX(value)) + 0.5; // +0.5 keeps 1px lines crisp
    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    ctx.moveTo(x, topMargin - 6);
    ctx.lineTo(x, plotBottom);
    ctx.stroke();

    ctx.fillStyle = mutedColor;
    ctx.fillText(formatMoney(value, "M", 0), x, plotBottom + 8);
  }

  // ---- 6. Draw one row per method: name, range text and the bar ----
  rows.forEach(function (row, index) {
    const rowTop = topMargin + index * rowHeight;
    const barHeight = 22;
    const barY = rowTop + (rowHeight - barHeight) / 2;

    // Method name (bold) and its range (muted) in the left column.
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = textColor;
    ctx.font = "600 13px Inter, system-ui, sans-serif";
    ctx.fillText(row.name, 0, rowTop + 22, labelWidth - 10);
    ctx.fillStyle = mutedColor;
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillText(formatMoney(row.low, "M", 0) + " – " + formatMoney(row.high, "M", 0), 0, rowTop + 39, labelWidth - 10);

    // The bar itself: from x(low) to x(high). Minimum 2px so a
    // zero-width range is still visible.
    const barX = valueToX(row.low);
    const barWidth = Math.max(valueToX(row.high) - barX, 2);
    ctx.fillStyle = barColor;
    drawRoundedBar(ctx, barX, barY, barWidth, barHeight, 4);
  });

  // ---- 7. Draw the dashed offer-price line (if one was entered) ----
  if (!isMissing(offerPrice)) {
    const x = valueToX(offerPrice);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]); // 6px dash, 4px gap
    ctx.beginPath();
    ctx.moveTo(x, topMargin - 6);
    ctx.lineTo(x, plotBottom);
    ctx.stroke();
    ctx.setLineDash([]); // Back to solid lines for anything drawn later.

    // Label above the line. Align it so it never runs off the edge.
    ctx.fillStyle = lineColor;
    ctx.font = "600 12px Inter, system-ui, sans-serif";
    ctx.textBaseline = "bottom";
    ctx.textAlign = x > cssWidth - 80 ? "right" : "center";
    ctx.fillText("Offer " + formatMoney(offerPrice, "M", 0), x, topMargin - 8);
  }

  // ---- 8. Describe the chart for screen readers ----
  const description = rows.map(function (row) {
    return row.name + " " + formatMoney(row.low, "M", 0) + " to " + formatMoney(row.high, "M", 0);
  }).join("; ");
  canvas.setAttribute("aria-label", "Football field chart. " + description +
    (isMissing(offerPrice) ? "" : ". Offer price " + formatMoney(offerPrice, "M", 0)));

  // Remember what we drew, for redraws.
  lastFootballRows = rows;
  lastOfferPrice = offerPrice;
}

/* ---------------------------------------------------------------------
   handleFootballFieldDraw (page code)
   WHAT: Reads the 5 rows of the table, validates them and draws.
   --------------------------------------------------------------------- */
function handleFootballFieldDraw(event) {
  // When called on page load there is no event, hence the check.
  if (event) {
    event.preventDefault();
  }
  const results = document.getElementById("football-results");
  results.innerHTML = "";

  const rows = [];
  for (let rowNumber = 1; rowNumber <= 5; rowNumber++) {
    const name = document.getElementById("ff-name-" + rowNumber).value.trim();
    const low = readNumber("ff-low-" + rowNumber);
    const high = readNumber("ff-high-" + rowNumber);

    // Completely empty row: skip it.
    if (name === "" && isMissing(low) && isMissing(high)) {
      continue;
    }
    // Partly filled row: tell the user what's missing.
    if (isMissing(low) || isMissing(high)) {
      return showError(results, "Row " + rowNumber + ": please enter both a low and a high value (or clear the row).");
    }
    if (low > high) {
      return showError(results, "Row " + rowNumber + ": the low value must not be larger than the high value.");
    }
    rows.push({ name: name || "Method " + rowNumber, low: low, high: high });
  }

  if (rows.length === 0) {
    return showError(results, "Please enter at least one method with a low and high value.");
  }

  drawFootballField(rows, readNumber("ff-offer"));
}

/* ---------------------------------------------------------------------
   redrawFootballField
   WHAT: Redraws the last chart (used when the window size or the
         light/dark colour scheme changes).
   --------------------------------------------------------------------- */
function redrawFootballField() {
  if (lastFootballRows.length > 0) {
    drawFootballField(lastFootballRows, lastOfferPrice);
  }
}


/* =====================================================================
   PART 4. START-UP
   WHAT: Connects each form's "submit" (button click or Enter key) to
         its handler function, and draws the default football field.
   ===================================================================== */
function setupCalculators() {
  document.getElementById("dcf-form").addEventListener("submit", handleDcfCalculate);
  document.getElementById("wacc-form").addEventListener("submit", handleWaccCalculate);
  document.getElementById("comps-form").addEventListener("submit", handleCompsCalculate);
  document.getElementById("synergy-form").addEventListener("submit", handleSynergyCalculate);
  document.getElementById("accretion-form").addEventListener("submit", handleAccretionCalculate);
  document.getElementById("football-form").addEventListener("submit", handleFootballFieldDraw);

  // CAPM checkbox: grey out unused inputs now and whenever it changes.
  document.getElementById("wacc-use-capm").addEventListener("change", updateCapmInputs);
  updateCapmInputs();

  // Draw the chart with default values so the page isn't empty.
  handleFootballFieldDraw();

  // Redraw when the window is resized or dark mode is toggled.
  window.addEventListener("resize", redrawFootballField);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawFootballField);

  // Redraw once the Inter font has loaded, so chart text uses it.
  if (document.fonts) {
    document.fonts.ready.then(redrawFootballField);
  }
}

setupCalculators();
