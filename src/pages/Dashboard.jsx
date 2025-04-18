import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_CONFIG from '../config/api';
import * as XLSX from 'xlsx';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalUnpaid: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to handle PDF download
  const handlePDFDownload = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const table = document.querySelector('.transactions-table');
    if (!table) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transactions Report</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
              }
              h1 {
                text-align: center;
                margin-bottom: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
                font-weight: bold;
              }
              .transaction-type {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
              }
              .transaction-type.credit {
                background-color: #dcfce7;
                color: #166534;
              }
              .transaction-type.debit {
                background-color: #fee2e2;
                color: #991b1b;
              }
            }
          </style>
        </head>
        <body>
          <h1>Transactions Report</h1>
          ${table.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Function to handle Excel download
  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      recentTransactions.map(transaction => ({
        Date: new Date(transaction.date).toLocaleDateString('en-IN'),
        Type: transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        Amount: `₹${transaction.amount.toLocaleString('en-IN')}`,
        Category: transaction.category || '-',
        Customer: transaction.customerName || '-',
        Description: transaction.description || '-'
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, 'transactions.xlsx');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(API_CONFIG.TRANSACTIONS.BASE, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        if (response.ok) {
          const data = await response.json();
          const transactions = Array.isArray(data) ? data : 
                            (data.success && Array.isArray(data.data) ? data.data : 
                            (Array.isArray(data.transactions) ? data.transactions : []));

          // Calculate totals based on transaction type (case insensitive)
          const totalPaid = transactions
            .filter(t => t.type.toLowerCase() === 'paid')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          const totalUnpaid = transactions
            .filter(t => t.type.toLowerCase() === 'unpaid')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          const totalAmount = totalPaid + totalUnpaid;
          
          setSummary({
            totalTransactions: transactions.length,
            totalAmount,
            totalPaid,
            totalUnpaid
          });

          const recent = [...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
          
          setRecentTransactions(recent);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="summary-grid">
        <div className="summary-card transactions">
          <h3>Total Transactions</h3>
          <p>{summary.totalTransactions}</p>
        </div>
        
        <div className="summary-card amount">
          <h3>Total Amount</h3>
          <p>₹{summary.totalAmount.toLocaleString()}</p>
        </div>

        <div className="summary-card paid">
          <h3>Total Paid</h3>
          <p>₹{summary.totalPaid.toLocaleString()}</p>
        </div>

        <div className="summary-card unpaid">
          <h3>Total Unpaid</h3>
          <p>₹{summary.totalUnpaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="transactions-container">
        <div className="transactions-header">
          <div className="header-top">
            <h2>Recent Transactions</h2>
            <div className="download-buttons">
              <button 
                onClick={handlePDFDownload}
                className="download-btn pdf"
              >
                Download PDF
              </button>
              <button 
                onClick={handleExcelDownload}
                className="download-btn excel"
              >
                Download Excel
              </button>
            </div>
          </div>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Customer</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td>
                      {new Date(transaction.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      <span className={`transaction-type ${transaction.type.toLowerCase()}`}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                    </td>
                    <td className="transaction-amount">
                      ₹{Number(transaction.amount).toLocaleString('en-IN')}
                    </td>
                    <td>{transaction.category || '-'}</td>
                    <td>{transaction.customerName || '-'}</td>
                    <td>{transaction.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No recent transactions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 