import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import API_CONFIG from '../config/api';
import './Transactions.css';
import React from 'react';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'paid',
    amount: '',
    description: '',
    category: '',
    customerName: '',
    items: []
  });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
    fetchStocks();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(API_CONFIG.TRANSACTIONS.BASE, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fetch transactions');
        return;
      }

      const data = await response.json();
      const transactionsData = Array.isArray(data) ? data : 
                             (data.success && Array.isArray(data.data) ? data.data : 
                             (Array.isArray(data.transactions) ? data.transactions : []));

      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStocks = async () => {
    try {
      const response = await fetch(API_CONFIG.STOCKS.BASE, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fetch stocks');
        return;
      }

      const data = await response.json();
      const stocksData = Array.isArray(data) ? data : 
                        (data.success && Array.isArray(data.data) ? data.data : 
                        (Array.isArray(data.stocks) ? data.stocks : []));

      setStocks(stocksData);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setError('Failed to fetch stocks');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingTransaction
        ? API_CONFIG.TRANSACTIONS.BY_ID(editingTransaction._id)
        : API_CONFIG.TRANSACTIONS.BASE;

      const method = editingTransaction ? 'PUT' : 'POST';

      // Transform items data to match API requirements
      const transformedItems = formData.items.map(item => {
        const stock = stocks.find(s => s._id === item.product);
        return {
          product: item.productName, // Keep the product ID
          name: stock?.productName || 'Unknown Product',
          quantity: Number(item.quantity),
          price: Number(item.price)
        };
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
          items: transformedItems
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error(errorData.message || 'Failed to save transaction');
        return;
      }

      const data = await response.json();
      toast.success(editingTransaction ? 'Transaction updated successfully' : 'Transaction added successfully');
      setShowForm(false);
      setFormData({
        type: 'paid',
        amount: '',
        description: '',
        category: '',
        customerName: '',
        items: []
      });
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError('Failed to save transaction');
    }
  };

  const handleDelete = async (transaction) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await fetch(API_CONFIG.TRANSACTIONS.BY_ID(transaction._id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to delete transaction');
        return;
      }

      toast.success('Transaction deleted successfully');
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction');
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description || '',
      category: transaction.category || '',
      customerName: transaction.customerName || '',
      items: transaction.items || []
    });
    setShowForm(true);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product: '', quantity: 1, price: 0 }]
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="transactions-page">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h1>Transactions</h1>
        <button
          className="add-transaction-btn"
          onClick={() => {
            setEditingTransaction(null);
            setFormData({
              type: 'paid',
              amount: '',
              description: '',
              category: '',
              customerName: '',
              items: []
            });
            setShowForm(true);
          }}
        >
          Add Transaction
        </button>
      </div>

      {showForm && (
        <div className="transaction-form">
          <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="amount">Amount</label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="customerName">Customer Name</label>
                <input
                  type="text"
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="items-section">
              <div className="items-header">
                <h3>Items</h3>
                <button type="button" className="add-item-btn" onClick={addItem}>
                  Add Item
                </button>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="item-row">
                  <select
                    value={item.product}
                    onChange={(e) => updateItem(index, 'product', e.target.value)}
                  >
                    <option value="">Select Product</option>
                    {stocks.map(stock => (
                      <option key={stock._id} value={stock._id}>
                        {stock.productName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    min="1"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                    min="0"
                  />
                  <button
                    type="button"
                    className="remove-item-btn"
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="form-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                {editingTransaction ? 'Update' : 'Add'} Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="transactions-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Customer</th>
            <th>Description</th>
            <th>Items</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <React.Fragment key={transaction._id}>
              <tr className="transaction-row">
                <td>{new Date(transaction.date).toLocaleDateString()}</td>
                <td>
                  <span className={`transaction-type ${transaction.type}`}>
                    {transaction.type}
                  </span>
                </td>
                <td>₹{transaction.amount.toLocaleString()}</td>
                <td>{transaction.category || '-'}</td>
                <td>{transaction.customerName || '-'}</td>
                <td>{transaction.description || '-'}</td>
                <td>
                  {transaction.items && transaction.items.length > 0 ? (
                    <button 
                      className="toggle-items-btn"
                      onClick={() => {
                        const row = document.getElementById(`items-${transaction._id}`);
                        row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
                      }}
                    >
                      {transaction.items.length} Items
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(transaction)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(transaction)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              {transaction.items && transaction.items.length > 0 && (
                <tr id={`items-${transaction._id}`} className="items-row" style={{ display: 'none' }}>
                  <td colSpan="8">
                    <table className="items-detail-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name || stocks.find(s => s._id === item.product)?.productName || 'Unknown Product'}</td>
                            <td>{item.quantity}</td>
                            <td>₹{item.price.toLocaleString()}</td>
                            <td>₹{(item.quantity * item.price).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Transactions;