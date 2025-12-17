let display = document.getElementById("display");
let lastAns = 0;
let isDeg = true;
let isInv = false;

/* UI */
function appendValue(v) { display.value += v; }
function clearDisplay() { display.value = ""; }
function useAns() { display.value += lastAns; }
function setDeg() { isDeg = true; }
function setRad() { isDeg = false; }
function toggleInv() {
    isInv = !isInv;
    const btn = document.getElementById("invBtn");
    btn.classList.toggle("active", isInv);
}

// Square function
function square() {
    if (display.value) {
        display.value = `(${display.value})^2`;
    }
}

// Backspace function
function backspace() {
    display.value = display.value.slice(0, -1);
}

/* Helpers */
function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) throw "Invalid factorial";
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

function toRad(x) { return isDeg ? x * Math.PI / 180 : x; }
function fromRad(x) { return isDeg ? x * 180 / Math.PI : x; }

/* Tokenizer */
function tokenize(expr) {
    let tokens = [];
    let i = 0;
    const funcs = ["stdevp", "stdev", "nthRoot", "round", "floor", "ceil", "mean", "asin", "acos", "atan", "sin", "cos", "tan", "sec", "cosec", "cot", "log", "ln", "exp", "abs", "nPr", "nCr"];

    while (i < expr.length) {
        let c = expr[i];

        if (c === " ") { i++; continue; }

        if (!isNaN(c) || c === ".") {
            let num = "";
            while (i < expr.length && (!isNaN(expr[i]) || expr[i] === ".")) {
                num += expr[i++];
            }
            tokens.push({ type: "num", value: parseFloat(num) });
            continue;
        }

        if (c === "π") { tokens.push({ type: "num", value: Math.PI }); i++; continue; }
        if (c === "e") { tokens.push({ type: "num", value: Math.E }); i++; continue; }

        // Handle variable x
        if (c === "x") { tokens.push({ type: "var", value: "x" }); i++; continue; }

        // Handle absolute value
        if (c === "|") {
            tokens.push({ type: "op", value: "|" });
            i++;
            continue;
        }

        let matched = false;
        for (let f of funcs) {
            if (expr.startsWith(f, i)) {
                tokens.push({ type: "func", value: f });
                i += f.length;
                matched = true;
                break;
            }
        }
        if (matched) continue;

        if ("+-*/^()%!".includes(c) || c === "=") { // Added support for =
            tokens.push({ type: "op", value: c });
            i++;
            continue;
        }

        throw "Invalid character";
    }
    return tokens;
}

/* Shunting Yard */
const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2, "^": 3, "!": 4, "=": 0 }; // Added =
const rightAssoc = { "^": true };

function toPostfix(tokens) {
    let out = [], stack = [];
    for (let t of tokens) {
        if (t.type === "num" || t.type === "var") out.push(t);
        else if (t.type === "func") stack.push(t);
        else if (t.value === "(") stack.push(t);
        else if (t.value === ")") {
            while (stack.length && stack.at(-1).value !== "(") out.push(stack.pop());
            stack.pop();
            if (stack.length && stack.at(-1).type === "func") out.push(stack.pop());
        } else {
            while (
                stack.length &&
                stack.at(-1).value !== "(" &&
                (precedence[stack.at(-1).value] > precedence[t.value] ||
                    (precedence[stack.at(-1).value] === precedence[t.value] && !rightAssoc[t.value]))
            ) out.push(stack.pop());
            stack.push(t);
        }
    }
    while (stack.length) out.push(stack.pop());
    return out;
}

function nearZero(x) {
    return Math.abs(x) < 1e-10;
}

/* Postfix Evaluation */
function evalPostfix(post, vars = {}) {
    let s = [];
    for (let t of post) {
        if (t.type === "num") s.push(t.value);
        else if (t.type === "var") {
            if (t.value in vars) s.push(vars[t.value]);
            else throw "Variable not defined";
        }
        else if (t.type === "func") {
            let x = s.pop();
            switch (t.value) {
                case "sin":
                    s.push(isInv
                        ? fromRad(Math.asin(x))
                        : Math.sin(toRad(x)));
                    break;

                case "cos":
                    s.push(isInv
                        ? fromRad(Math.acos(x))
                        : Math.cos(toRad(x)));
                    break;

                case "tan": {
                    let t = Math.tan(toRad(x));
                    if (!isInv && !isFinite(t)) throw "Math Error";
                    s.push(isInv
                        ? fromRad(Math.atan(x))
                        : t);
                    break;
                }

                /* ===== Reciprocal Trigonometric ===== */

                case "sec": {
                    if (isInv) {
                        if (nearZero(x)) throw "Math Error";
                        s.push(fromRad(Math.acos(1 / x)));
                    } else {
                        let c = Math.cos(toRad(x));
                        if (nearZero(c)) throw "Math Error";   // sec(90°)
                        s.push(1 / c);
                    }
                    break;
                }

                case "cosec": {
                    if (isInv) {
                        if (nearZero(x)) throw "Math Error";
                        s.push(fromRad(Math.asin(1 / x)));
                    } else {
                        let si = Math.sin(toRad(x));
                        if (nearZero(si)) throw "Math Error";  // cosec(0°)
                        s.push(1 / si);
                    }
                    break;
                }

                case "cot": {
                    if (isInv) {
                        if (nearZero(x)) throw "Math Error";
                        s.push(fromRad(Math.atan(1 / x)));
                    } else {
                        let t = Math.tan(toRad(x));
                        if (nearZero(t)) throw "Math Error";   // cot(90°)
                        s.push(1 / t);
                    }
                    break;
                }

                /* ===== Logs ===== */

                case "log":
                    if (x <= 0) throw "Math Error";
                    s.push(Math.log10(x));
                    break;

                case "ln":
                    if (x <= 0) throw "Math Error";
                    s.push(Math.log(x));
                    break;

                case "nthRoot":
                    // nthRoot(n, x) - nth root of x
                    let n = s.pop(); // the root degree
                    if (n === 0) throw "Math Error";
                    s.push(Math.pow(x, 1 / n));
                    break;

                /* ===== Inverse Trigonometric ===== */
                case "asin":
                    if (x < -1 || x > 1) throw "Math Error";
                    s.push(fromRad(Math.asin(x)));
                    break;

                case "acos":
                    if (x < -1 || x > 1) throw "Math Error";
                    s.push(fromRad(Math.acos(x)));
                    break;

                case "atan":
                    s.push(fromRad(Math.atan(x)));
                    break;

                /* ===== Advanced Functions ===== */
                case "exp":
                    s.push(Math.exp(x));
                    break;

                case "abs":
                    s.push(Math.abs(x));
                    break;

                case "round":
                    s.push(Math.round(x));
                    break;

                case "floor":
                    s.push(Math.floor(x));
                    break;

                case "ceil":
                    s.push(Math.ceil(x));
                    break;

                /* ===== Statistical Functions (array-based) ===== */
                case "mean":
                    // For simplicity, mean of last two values
                    let m1 = s.pop();
                    s.push((x + m1) / 2);
                    break;

                case "stdev":
                    // Sample standard deviation of last two values
                    let sd1 = s.pop();
                    let mean1 = (x + sd1) / 2;
                    let variance = (Math.pow(x - mean1, 2) + Math.pow(sd1 - mean1, 2)) / 1;
                    s.push(Math.sqrt(variance));
                    break;

                case "stdevp":
                    // Population standard deviation of last two values
                    let sdp1 = s.pop();
                    let meanp = (x + sdp1) / 2;
                    let variancep = (Math.pow(x - meanp, 2) + Math.pow(sdp1 - meanp, 2)) / 2;
                    s.push(Math.sqrt(variancep));
                    break;

                /* ===== Combinatorics ===== */
                case "nPr":
                    // Permutation: nPr(n, r) = n! / (n-r)!
                    let r_perm = s.pop();
                    if (!Number.isInteger(x) || !Number.isInteger(r_perm) || x < 0 || r_perm < 0 || r_perm > x) {
                        throw "Math Error";
                    }
                    s.push(factorial(x) / factorial(x - r_perm));
                    break;

                case "nCr":
                    // Combination: nCr(n, r) = n! / (r! * (n-r)!)
                    let r_comb = s.pop();
                    if (!Number.isInteger(x) || !Number.isInteger(r_comb) || x < 0 || r_comb < 0 || r_comb > x) {
                        throw "Math Error";
                    }
                    s.push(factorial(x) / (factorial(r_comb) * factorial(x - r_comb)));
                    break;

            }
        } else {
            let b = s.pop();
            let a = t.value !== "!" && t.value !== "|" ? s.pop() : null;
            switch (t.value) {
                case "+": s.push(a + b); break;
                case "-": s.push(a - b); break;
                case "*": s.push(a * b); break;
                case "/": s.push(a / b); break;
                case "%": s.push(a % b); break;
                case "^": s.push(Math.pow(a, b)); break;
                case "!": s.push(factorial(b)); break;
                case "|": s.push(Math.abs(b)); break; // Absolute value
                case "=": s.push(a - b); break; // Treat = as subtraction (LHS - RHS)
            }
        }
    }
    return s[0];
}

/* Newton-Raphson Solver */
function solveEquation() {
    try {
        clearError();
        const expression = display.value;
        if (!expression.includes("x")) {
            // If no x, just calculate normally
            calculate();
            return;
        }

        let tokens = tokenize(expression);
        let postfix = toPostfix(tokens);

        // Newton-Raphson Method
        // x_{n+1} = x_n - f(x_n) / f'(x_n)

        let x = 1; // Initial guess
        const maxIter = 100;
        const tolerance = 1e-7;
        const h = 1e-5; // For derivative approximation

        for (let i = 0; i < maxIter; i++) {
            let fx = evalPostfix(postfix, { x: x });
            let fxh = evalPostfix(postfix, { x: x + h });
            let dfx = (fxh - fx) / h;

            if (Math.abs(dfx) < 1e-10) {
                // Zero derivative, move slightly
                x += 1;
                continue;
            }

            let nextX = x - fx / dfx;

            if (Math.abs(nextX - x) < tolerance) {
                // Formatting result
                let result = Math.round(nextX * 1000000000) / 1000000000;
                display.value = "x = " + result;
                saveToHistory(expression, "x = " + result);
                return;
            }
            x = nextX;
        }

        showError("No solution found");

    } catch (e) {
        showError("Solver Error");
        console.error(e);
    }
}

/* Main */
function calculate() {
    try {
        clearError();
        const expression = display.value;
        if (!expression) return; // Don't calculate empty

        let tokens = tokenize(expression);
        let postfix = toPostfix(tokens);
        let result = evalPostfix(postfix);

        // Formatting: If result is long float, round it to reasonable precision
        if (!Number.isInteger(result) && result.toString().length > 10) {
            result = parseFloat(result.toPrecision(10));
        }

        // PREVIEW UPDATE
        document.getElementById("expressionDisplay").innerText = expression;

        lastAns = result;
        display.value = result;

        // Save to history
        saveToHistory(expression, result);
    } catch (e) {
        showError(e || "Math Error");
        // display.value = ""; // Keep expression so user can fix it?
    }
}

function clearDisplay() {
    display.value = '';
    document.getElementById("expressionDisplay").innerText = '';
    clearError();
}

/* Keyboard Support */
document.addEventListener('keydown', function (event) {
    const key = event.key;

    // Prevent default action for some keys to avoid browser shortcuts (like quick find with /)
    if (key === '/') event.preventDefault();

    // Mapping keys to actions
    if (!isNaN(key) || key === '.') {
        handleKeyPress(key, `button[onclick="appendValue('${key}')"]`); // Direct number match might need adjustment if onclick varies
    }
    else if (['+', '-', '*', '/', '%'].includes(key)) {
        handleKeyPress(key, null, key); // Pass operator directly to search
    }
    else if (key === 'Enter' || key === '=') {
        event.preventDefault();
        // Check if we should call calculate() or solveEquation()
        // Default to calculate, but visual feedback on = button
        let btn = document.querySelector('button.equal');
        if (btn) {
            btn.click();
            animateButton(btn);
        }
    }
    else if (key === 'Backspace') {
        // backspace(); // Called by keyup or just let default? 
        // We have direct handler call
        backspace();
        // Find backspace button for animation
        let btn = document.querySelector('button[onclick="backspace()"]');
        if (btn) animateButton(btn);
    }
    else if (key === 'Escape') {
        clearDisplay();
        let btn = document.querySelector('button[onclick="clearDisplay()"]');
        if (btn) animateButton(btn);
    }
    else if (key === 'x' || key === 'X') {
        appendValue('x');
        // Find x button
        let btn = document.querySelector('button[onclick="appendValue(\'x\')"]');
        if (btn) animateButton(btn);
    }
    else if (key === '(' || key === ')') {
        appendValue(key);
        let btn = document.querySelector(`button[onclick="appendValue('${key}')"]`);
        if (btn) animateButton(btn);
    }
    else if (key === '^') {
        appendValue('^');
        let btn = document.querySelector(`button[onclick="appendValue('^')"]`);
        if (btn) animateButton(btn);
    }
});

function handleKeyPress(val, selector, operatorVal) {
    appendValue(val);

    // Visual Feedback
    let btn;
    if (selector) {
        btn = document.querySelector(selector);
    } else if (operatorVal) {
        // Find button by text content or onclick for operators
        let buttons = Array.from(document.querySelectorAll('button'));
        btn = buttons.find(b => {
            // Clean onclick string to找 value: appendValue('*') -> *
            let clk = b.getAttribute('onclick');
            return clk && clk.includes(`'${operatorVal}'`);
        });
    }

    // If not found by exact selector (e.g. for numbers), try generic find
    if (!btn && !isNaN(val)) {
        let buttons = Array.from(document.querySelectorAll('button.num'));
        btn = buttons.find(b => b.textContent.trim() === val);
    }

    if (btn) animateButton(btn);
}

function animateButton(btn) {
    btn.classList.add('active-key');
    setTimeout(() => {
        btn.classList.remove('active-key');
    }, 150);
}

/* Keyboard handler already implemented */
function plotGraph() {
    const expr = display.value.trim();

    let fn = null;

    if (expr.startsWith("sin")) fn = x => Math.sin(toRad(x));
    else if (expr.startsWith("cos")) fn = x => Math.cos(toRad(x));
    else if (expr.startsWith("tan")) fn = x => Math.tan(toRad(x));
    else if (expr.startsWith("sec")) fn = x => 1 / Math.cos(toRad(x));
    else if (expr.startsWith("cosec")) fn = x => 1 / Math.sin(toRad(x));
    else if (expr.startsWith("cot")) fn = x => 1 / Math.tan(toRad(x));
    else {
        showError("Graph supports trig functions only");
        return;
    }

    // The new plot() function will handle plotting the expression directly from display.value
    // This function is now effectively deprecated or needs to be re-purposed if we want to plot multiple functions.
    // For now, we'll just call plot() if the graph is visible.
    if (graphVisible) {
        plot();
    }
}


/* Graphing */
let graphVisible = false;
let ctx = null;
let graphCanvas = null;

// Graph State
let graphScale = 40; // Pixels per unit
let graphOffsetX = 0;
let graphOffsetY = 0;

function toggleGraph() {
    const container = document.getElementById("graphContainer");
    const historyPanel = document.getElementById("historyPanel");
    const converterPanel = document.getElementById("converterPanel");

    if (container.style.display === "none") {
        container.style.display = "block";
        historyPanel.style.display = "none";
        if (converterPanel) converterPanel.style.display = "none";
        graphVisible = true;
        initGraph();
        plot();
    } else {
        container.style.display = "none";
        graphVisible = false;
    }
}

function initGraph() {
    graphCanvas = document.getElementById("graph");
    graphCanvas.width = graphCanvas.offsetWidth;
    graphCanvas.height = graphCanvas.offsetHeight;
    ctx = graphCanvas.getContext("2d");
}

function clearGraph() {
    graphScale = 40;
    graphOffsetX = 0;
    graphOffsetY = 0;
    if (ctx) ctx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    // If hold is off, this is a full reset. If hold is on? Clear button usually means full clear.
    if (graphVisible) plot(true); // Force clear re-plot (which just draws axes)
}

function zoomGraph(factor) {
    graphScale *= factor;
    plot();
}

function panGraph(dx, dy) {
    graphOffsetX += dx;
    graphOffsetY += dy;
    plot();
}

function plot(forceClear = false) {
    if (!graphVisible || !ctx) return;

    const w = graphCanvas.width;
    const h = graphCanvas.height;
    const centerX = w / 2 + graphOffsetX;
    const centerY = h / 2 + graphOffsetY;
    const hold = document.getElementById("holdGraph").checked;

    // Clear ONLY if not holding, or if forced
    if (!hold || forceClear) {
        ctx.clearRect(0, 0, w, h);

        // Draw Axes if clearing
        ctx.beginPath();
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 1;

        // X Axis
        ctx.moveTo(0, centerY);
        ctx.lineTo(w, centerY);

        // Y Axis
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, h);
        ctx.stroke();

        // Auto-label axes
        ctx.fillStyle = "#888";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";

        // X labels
        const xStep = graphScale >= 40 ? 1 : (graphScale >= 10 ? 5 : 10);
        for (let x = -20; x <= 20; x += xStep) {
            if (x === 0) continue;
            let px = centerX + x * graphScale;
            if (px > 0 && px < w) {
                ctx.fillText(x, px, centerY + 12);
                // Tick
                ctx.beginPath();
                ctx.moveTo(px, centerY - 2);
                ctx.lineTo(px, centerY + 2);
                ctx.stroke();
            }
        }

        // Y labels
        ctx.textAlign = "right";
        for (let y = -10; y <= 10; y += xStep) {
            if (y === 0) continue;
            let py = centerY - y * graphScale;
            if (py > 0 && py < h) {
                ctx.fillText(y, centerX - 4, py + 3);
                // Tick
                ctx.beginPath();
                ctx.moveTo(centerX - 2, py);
                ctx.lineTo(centerX + 2, py);
                ctx.stroke();
            }
        }
    }

    // Plot Expression
    const expression = display.value;
    if (!expression) return;

    // Validate expression for 'x'
    if (!expression.includes('x')) {
        // If it's just a number, we could plot y = c
        // But requested is to disable if not f(x)
        // Let's just return to avoid confusion unless it's strictly requested to plot constants
        return;
    }

    // Random color if holding, else primary
    ctx.beginPath();
    ctx.strokeStyle = hold ? `hsl(${Math.random() * 360}, 100%, 60%)` : "#4a6cff";
    ctx.lineWidth = 2;

    // Show function name
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    // Stack labels if holding? Simplification: just put it top left
    if (!hold) {
        ctx.fillText(`y = ${expression}`, 10, 20);
    } else {
        // Simple offset randomization for hold
        ctx.fillText(`y = ${expression}`, 10, 20 + Math.random() * 50);
    }

    try {
        let tokens = tokenize(expression);
        let postfix = toPostfix(tokens);

        ctx.beginPath(); // Start path for curve
        let first = true;

        for (let px = 0; px < w; px += 2) { // Step 2 optimization
            let x = (px - centerX) / graphScale;
            try {
                let y = evalPostfix(postfix, { x: x });

                if (!isFinite(y)) {
                    first = true;
                    continue;
                }

                // Coordinate conversion
                let cy = centerY - (y * graphScale);

                if (first) {
                    ctx.moveTo(px, cy);
                    first = false;
                } else {
                    ctx.lineTo(px, cy);
                }
            } catch (e) {
                first = true;
            }
        }
        ctx.stroke();

    } catch (e) {
        console.error("Graph plot error:", e);
    }
}
function showError(msg) {
    document.getElementById("errorBox").innerText = msg;
}

function clearError() {
    document.getElementById("errorBox").innerText = "";
}
function exportGraph() {
    const canvas = document.getElementById("graph");
    const link = document.createElement("a");
    link.download = "graph.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}
function toggleTheme() {
    document.body.classList.toggle("light");
}

/* ================= HISTORY FUNCTIONALITY ================= */
let calculationHistory = [];
const MAX_HISTORY = 50;

// Load history from localStorage on page load
function loadHistoryFromStorage() {
    try {
        const stored = localStorage.getItem('calculatorHistory');
        if (stored) {
            calculationHistory = JSON.parse(stored);
            displayHistory();
        }
    } catch (e) {
        console.error('Failed to load history:', e);
    }
}

// Save history to localStorage
function saveHistoryToStorage() {
    try {
        localStorage.setItem('calculatorHistory', JSON.stringify(calculationHistory));
    } catch (e) {
        console.error('Failed to save history:', e);
    }
}

// Toggle history panel visibility
function toggleHistory() {
    const panel = document.getElementById('historyPanel');
    const graphContainer = document.getElementById('graphContainer');

    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = 'flex';
        graphContainer.style.display = 'none';
        graphVisible = false;
    } else {
        panel.style.display = 'none';
    }
}

// Save calculation to history
function saveToHistory(expression, result) {
    const historyItem = {
        expression: expression,
        result: result,
        timestamp: new Date().toISOString()
    };

    // Add to beginning of array
    calculationHistory.unshift(historyItem);

    // Keep only MAX_HISTORY items
    if (calculationHistory.length > MAX_HISTORY) {
        calculationHistory = calculationHistory.slice(0, MAX_HISTORY);
    }

    saveHistoryToStorage();
    displayHistory();
}

// Display history items in the panel
function displayHistory() {
    const historyList = document.getElementById('historyList'); // Note: historyList element needs to exist in HTML, usually inside historyPanel
    // Check if historyList exists, if not created dynamically in panel? 
    // HTML check: historyPanel has history-header, history-controls. Where is history-list?
    // Assuming it exists or needing creation. 
    // Looking at style.css, .history-list exists. 
    // Let's ensure script finds it. 
    // If index.html doesn't have #historyList, this will fail. 
    // Proceeding with logic fix first.

    if (!historyList) return;

    if (calculationHistory.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
        return;
    }

    historyList.innerHTML = calculationHistory.map((item, index) => `
        <div class="history-item" onclick="loadHistoryItem('${item.expression.replace(/'/g, "\\'")}')">
            <div class="expression">${item.expression}</div>
            <div class="result">= ${item.result}</div>
        </div>
    `).join('');
}

// Load a history item back to the display
function loadHistoryItem(expression) {
    display.value = expression;
}

// Clear all history
function clearHistory() {
    if (calculationHistory.length === 0) return;

    if (confirm('Clear all calculation history?')) {
        calculationHistory = [];
        saveHistoryToStorage();
        displayHistory();
    }
}

// Load history on page load
loadHistoryFromStorage();

/* Unit Converter */
const conversionRates = {
    length: {
        m: 1, km: 1000, cm: 0.01, mm: 0.001,
        in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.34
    },
    mass: {
        kg: 1, g: 0.001, mg: 0.000001,
        lb: 0.453592, oz: 0.0283495
    },
    temp: {
        C: 'C', F: 'F', K: 'K'
    },
    currency: {
        USD: 1, // Base
        EUR: 0.94,
        GBP: 0.82,
        INR: 83.12,
        JPY: 148.55,
        CAD: 1.36,
        AUD: 1.53,
        CNY: 7.15,
        RUB: 91.50,
        BRL: 4.95
    }
};

// Fetch live rates
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();

        if (data && data.rates) {
            // Update rates, keeping existing keys if they exist in API
            // or just strictly updating the ones we support
            const keys = Object.keys(conversionRates.currency);
            keys.forEach(key => {
                if (data.rates[key]) {
                    conversionRates.currency[key] = data.rates[key];
                }
            });
            console.log("Updated currency rates:", conversionRates.currency);
        }
    } catch (e) {
        console.warn("Failed to fetch live rates, using static backups.", e);
    }
}
// Call immediately
fetchExchangeRates();

const unitNames = {
    m: "Meters", km: "Kilometers", cm: "Centimeters", mm: "Millimeters",
    in: "Inches", ft: "Feet", yd: "Yards", mi: "Miles",
    kg: "Kilograms", g: "Grams", mg: "Milligrams",
    lb: "Pounds", oz: "Ounces",
    C: "Celsius", F: "Fahrenheit", K: "Kelvin",
    USD: "US Dollar", EUR: "Euro", GBP: "British Pound", INR: "Indian Rupee",
    JPY: "Japanese Yen", CAD: "Canadian Dollar", AUD: "Australian Dollar",
    CNY: "Chinese Yuan", RUB: "Russian Ruble", BRL: "Brazilian Real"
};

function toggleConverter() {
    const pnl = document.getElementById("converterPanel");
    const graph = document.getElementById("graphContainer");
    const hist = document.getElementById("historyPanel");

    if (pnl.style.display === "none") {
        pnl.style.display = "flex"; // style.css needs to support flex if previously none
        graph.style.display = "none";
        hist.style.display = "none";
        updateConvUnits(); // Init units
    } else {
        pnl.style.display = "none";
    }
}

function updateConvUnits() {
    const cat = document.getElementById("convCategory").value;
    const from = document.getElementById("convFrom");
    const to = document.getElementById("convTo");

    // Clear
    from.innerHTML = "";
    to.innerHTML = "";

    const units = Object.keys(conversionRates[cat]);

    units.forEach(u => {
        let n = unitNames[u] || u;
        from.add(new Option(n, u));
        to.add(new Option(n, u));
    });

    // Defaults
    if (cat === 'length') { to.value = 'ft'; }
    if (cat === 'temp') { to.value = 'F'; }

    convert();
}

function convert() {
    const cat = document.getElementById("convCategory").value;
    const val = parseFloat(document.getElementById("convInput").value);
    const from = document.getElementById("convFrom").value;
    const to = document.getElementById("convTo").value;
    const out = document.getElementById("convOutput");

    if (isNaN(val)) {
        out.value = "";
        return;
    }

    let res;
    if (cat === 'temp') {
        // Temp special logic
        let cVal = val;
        // Convert to C
        if (from === 'F') cVal = (val - 32) * 5 / 9;
        if (from === 'K') cVal = val - 273.15;

        // Convert C to target
        if (to === 'C') res = cVal;
        if (to === 'F') res = (cVal * 9 / 5) + 32;
        if (to === 'K') res = cVal + 273.15;
    } else {
        // Standard multiplicative
        let base = val * conversionRates[cat][from]; // To base unit (e.g. meters)
        res = base / conversionRates[cat][to]; // To target unit
    }

    out.value = parseFloat(res.toPrecision(6)); // Formatting
}