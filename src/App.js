import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
} from 'recharts';
import './App.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const loanProducts = [
  { id: 1, name: 'Personal Loan', interestRate: 12, maxTenure: 24 },
  { id: 2, name: 'Home Loan', interestRate: 8, maxTenure: 60 },
  { id: 3, name: 'Auto Loan', interestRate: 10, maxTenure: 36 },
];

function App() {
  const [salary, setSalary] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [tenure, setTenure] = useState('');
  const [loanType, setLoanType] = useState('personal');
  const [message, setMessage] = useState('');
  const [emiDetails, setEmiDetails] = useState(null);
  const [amortization, setAmortization] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comparisonResults, setComparisonResults] = useState([]);

  const interestRates = {
    personal: 12,
    home: 8,
    auto: 10,
  };

  const calculateEMI = (P, r, n) => {
    const monthlyRate = r / 12 / 100;
    return (P * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  };

  const generateAmortization = (P, r, n, emi) => {
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setEmiDetails(null);
    setAmortization([]);
    setComparisonResults([]);

    // Validation
    if (!salary || !loanAmount || !tenure ||
      salary <= 0 || loanAmount <= 0 || tenure <= 0) {
      setMessage('Please enter valid positive numbers in all fields.');
      setLoading(false);
      return;
    }

    // Calculate main EMI and amortization for selected loan type
    const interestRate = interestRates[loanType];
    const emi = calculateEMI(Number(loanAmount), interestRate, Number(tenure));
    const maxEMI = salary * 0.4;
    const eligible = emi <= maxEMI;

    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - loanAmount;

    setMessage(
      eligible
        ? `🎉 Congrats! You are eligible. Your EMI is ₹${emi.toFixed(2)} per month.`
        : `⚠️ Sorry, you are not eligible. EMI of ₹${emi.toFixed(2)} exceeds 40% of your salary.`
    );

    setEmiDetails({
      emi: emi.toFixed(2),
      totalPayment: totalPayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      principal: loanAmount,
      eligible,
    });

    setAmortization(generateAmortization(Number(loanAmount), interestRate, Number(tenure), emi));

    // --- New Feature: Compare multiple loan products ---
    const comparison = loanProducts.map((product) => {
      if (tenure > product.maxTenure) {
        return {
          ...product,
          eligible: false,
          emi: null,
          totalPayment: null,
          totalInterest: null,
          message: `Not eligible (max tenure: ${product.maxTenure} months)`,
        };
      }
      const productEMI = calculateEMI(Number(loanAmount), product.interestRate, Number(tenure));
      const productEligible = productEMI <= maxEMI;
      return {
        ...product,
        emi: productEMI.toFixed(2),
        totalPayment: (productEMI * tenure).toFixed(2),
        totalInterest: ((productEMI * tenure) - loanAmount).toFixed(2),
        eligible: productEligible,
        message: productEligible
          ? 'Eligible'
          : `Not eligible (EMI ₹${productEMI.toFixed(2)} exceeds 40% salary)`,
      };
    });

    setComparisonResults(comparison);
    setLoading(false);
  };

  const pieData = emiDetails ? [
    { name: 'Principal', value: Number(emiDetails.principal) },
    { name: 'Total Interest', value: Number(emiDetails.totalInterest) },
  ] : [];

  return (
    <div className="app-container">
      <h1 className="title">EMI Eligibility Checker</h1>

      <form onSubmit={handleSubmit} className="form-container" noValidate>
        <div className="input-group">
          <label htmlFor="salary">Salary (₹):</label>
          <input
            type="number"
            id="salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="Enter your monthly salary"
            min="1"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="loanAmount">Loan Amount (₹):</label>
          <input
            type="number"
            id="loanAmount"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            placeholder="Enter desired loan amount"
            min="1"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="tenure">Loan Tenure (Months):</label>
          <input
            type="number"
            id="tenure"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            placeholder="Enter loan tenure in months"
            min="1"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="loanType">Loan Type:</label>
          <select
            id="loanType"
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
          >
            <option value="personal">Personal (12%)</option>
            <option value="home">Home (8%)</option>
            <option value="auto">Auto (10%)</option>
          </select>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Calculating...' : 'Check Eligibility'}
        </button>
      </form>

      {message && (
        <p className={`message ${emiDetails?.eligible ? 'success' : 'error'}`}>
          {message}
        </p>
      )}

      {emiDetails && (
        <>
          <div className="result-container">
            <h2>EMI Details</h2>
            <p><strong>Monthly EMI:</strong> ₹{emiDetails.emi}</p>
            <p><strong>Total Payment:</strong> ₹{emiDetails.totalPayment}</p>
            <p><strong>Total Interest:</strong> ₹{emiDetails.totalInterest}</p>
          </div>

          <div className="chart-container">
            <h3>Payment Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="amortization-container">
            <h3>Amortization Schedule</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Principal Paid (₹)</th>
                    <th>Interest Paid (₹)</th>
                    <th>Remaining Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {amortization.map(({ month, principal, interest, balance }) => (
                    <tr key={month}>
                      <td>{month}</td>
                      <td>{principal}</td>
                      <td>{interest}</td>
                      <td>{balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* New Loan Product Comparison Section */}
      {comparisonResults.length > 0 && (
        <div className="comparison-container">
          <h2>Loan Product Comparison</h2>
          <div className="comparison-grid">
            {comparisonResults.map(product => (
              <div
                key={product.id}
                className={`comparison-card ${product.eligible ? 'eligible' : 'not-eligible'}`}
              >
                <h3>{product.name}</h3>
                <p>Interest Rate: {product.interestRate}% p.a.</p>
                <p>Max Tenure: {product.maxTenure} months</p>
                <p>Status: <strong>{product.message}</strong></p>
                {product.eligible && (
                  <>
                    <p>Monthly EMI: ₹{product.emi}</p>
                    <p>Total Payment: ₹{product.totalPayment}</p>
                    <p>Total Interest: ₹{product.totalInterest}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
