require('dotenv').config(); // load .env config
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the EMI Checker backend!');
});

// Interest rates per loan type
const interestRates = {
  personal: 12,
  home: 8,
  auto: 10,
};

// Calculate EMI
function calculateEMI(P, r, n) {
  const monthlyRate = r / 12 / 100;
  return (P * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

// Generate amortization schedule
function generateAmortization(P, r, n, emi) {
  const schedule = [];
  let balance = P;
  const monthlyRate = r / 12 / 100;

  for (let i = 1; i <= n; i++) {
    const interest = balance * monthlyRate;
    const principal = emi - interest;
    balance -= principal;

    schedule.push({
      month: i,
      principal: principal.toFixed(2),
      interest: interest.toFixed(2),
      balance: balance < 0 ? '0.00' : balance.toFixed(2),
    });
  }
  return schedule;
}

// API route for eligibility check
app.post('/api/check-eligibility', (req, res, next) => {
  try {
    const { salary, loanAmount, tenureMonths, loanType } = req.body;

    // Validate inputs
    if (
      !salary || !loanAmount || !tenureMonths || !loanType ||
      typeof salary !== 'number' || typeof loanAmount !== 'number' || typeof tenureMonths !== 'number' ||
      salary <= 0 || loanAmount <= 0 || tenureMonths <= 0
    ) {
      return res.status(400).json({
        message: 'Invalid input. Please provide positive numbers for salary, loan amount, tenure, and select loan type.'
      });
    }

    if (!interestRates.hasOwnProperty(loanType)) {
      return res.status(400).json({ message: 'Invalid loan type. Choose from personal, home, or auto.' });
    }

    const interestRate = interestRates[loanType];
    const emi = calculateEMI(loanAmount, interestRate, tenureMonths);
    const maxEMI = salary * 0.4;

    const eligible = emi <= maxEMI;
    const totalPayment = emi * tenureMonths;
    const totalInterest = totalPayment - loanAmount;
    const amortizationSchedule = generateAmortization(loanAmount, interestRate, tenureMonths, emi);

    res.json({
      eligible,
      emi: emi.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      message: eligible
        ? `Congrats! You are eligible. Your EMI is ₹${emi.toFixed(2)} per month.`
        : `Sorry, you are not eligible. EMI of ₹${emi.toFixed(2)} exceeds 40% of your salary.`,
      amortizationSchedule,
    });

  } catch (error) {
    next(error);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error. Please try again later.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
