import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_CONFIG from '../config/api';
import { toast } from 'react-toastify';
import './Billing.css';

const Billing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    phone: ''
  });
  const [stockItems, setStockItems] = useState([{ product: '', quantity: 1, price: 0, isCustomPrice: false }]);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [total, setTotal] = useState(0);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
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

        setAvailableStocks(stocksData);
      } catch (error) {
        console.error('Error fetching stocks:', error);
        toast.error('Failed to fetch stocks');
      } finally {
        setStocksLoading(false);
      }
    };

    if (user) {
      fetchStocks();
    }
  }, [user]);

  if (loading || !user) {
    return null;
  }

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStockChange = (index, field, value) => {
    const newStockItems = [...stockItems];
    if (field === 'product') {
      const selectedStock = availableStocks.find(s => s._id === value);
      newStockItems[index] = {
        ...newStockItems[index],
        product: value,
        price: selectedStock ? selectedStock.price : 0,
        isCustomPrice: false,
        maxQuantity: selectedStock ? selectedStock.quantity : 0
      };
    } else if (field === 'quantity') {
      const quantity = parseInt(value) || 0;
      const selectedStock = availableStocks.find(s => s._id === newStockItems[index].product);
      const maxQuantity = selectedStock ? selectedStock.quantity : 0;
      
      if (quantity > maxQuantity) {
        toast.error(`Maximum available quantity is ${maxQuantity}`);
        return;
      }

      newStockItems[index] = {
        ...newStockItems[index],
        quantity: quantity
      };
    } else if (field === 'price') {
      newStockItems[index] = {
        ...newStockItems[index],
        price: parseFloat(value) || 0,
        isCustomPrice: true
      };
    } else {
      newStockItems[index] = {
        ...newStockItems[index],
        [field]: value
      };
    }
    setStockItems(newStockItems);
    calculateTotal(newStockItems);
  };

  const addStockItem = () => {
    setStockItems([...stockItems, { product: '', quantity: 1, price: 0, isCustomPrice: false }]);
  };

  const removeStockItem = (index) => {
    const newStockItems = stockItems.filter((_, i) => i !== index);
    setStockItems(newStockItems);
    calculateTotal(newStockItems);
  };

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    setTotal(sum);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveBill = async () => {
    if (!customerDetails.name || !customerDetails.phone) {
      toast.error('Please enter customer details');
      return;
    }

    if (stockItems.length === 0 || stockItems.some(item => !item.product)) {
      toast.error('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      const billData = {
        customerName: customerDetails.name,
        phoneNumber: customerDetails.phone,
        items: stockItems.map(item => {
          const selectedStock = availableStocks.find(s => s._id === item.product);
          return {
            itemName: selectedStock ? selectedStock.productName : '',
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price
          };
        }),
        finalTotal: total
      };

      const response = await fetch(API_CONFIG.ORDERS.BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(billData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save bill');
      }

      const data = await response.json();
      toast.success('Bill saved successfully');
      
      // Reset form
      setCustomerDetails({ name: '', phone: '' });
      setStockItems([{ product: '', quantity: 1, price: 0, isCustomPrice: false }]);
      setTotal(0);
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error(error.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="billing-container">
      <h2 className="billing-title">Create Bill</h2>

      <div className="billing-section">
        <h3>Customer Details</h3>
        <div className="customer-form">
          <div className="form-group">
            <label htmlFor="customerName">Customer Name</label>
            <input
              type="text"
              id="customerName"
              name="name"
              value={customerDetails.name}
              onChange={handleCustomerChange}
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="text"
              id="phoneNumber"
              name="phone"
              value={customerDetails.phone}
              onChange={handleCustomerChange}
              className="form-control"
            />
          </div>
        </div>
      </div>

      <div className="billing-section">
        <div className="section-header">
          <h3>Stock Items</h3>
          <button onClick={addStockItem} className="btn btn-primary">
            Add Item
          </button>
        </div>

        {stocksLoading ? (
          <div className="loading">Loading stocks...</div>
        ) : (
          <table className="stock-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity (Available)</th>
                <th>Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {stockItems.map((item, index) => {
                const selectedStock = availableStocks.find(s => s._id === item.product);
                return (
                  <tr key={index}>
                    <td>
                      <select
                        value={item.product}
                        onChange={(e) => handleStockChange(index, 'product', e.target.value)}
                        className="form-control"
                      >
                        <option value="">Select Item</option>
                        {availableStocks.map(stock => (
                          <option key={stock._id} value={stock._id}>
                            {stock.productName} (Available: {stock.quantity})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="quantity-input">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleStockChange(index, 'quantity', e.target.value)}
                          className="form-control"
                          min="1"
                          max={selectedStock ? selectedStock.quantity : 1}
                        />
                        {selectedStock && (
                          <span className="available-quantity">
                            Available: {selectedStock.quantity}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="price-input">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleStockChange(index, 'price', e.target.value)}
                          className="form-control"
                          min="0"
                          step="0.01"
                        />
                        {selectedStock && !item.isCustomPrice && (
                          <small className="price-hint">Default: ₹{selectedStock.price}</small>
                        )}
                      </div>
                    </td>
                    <td>₹{item.quantity * item.price}</td>
                    <td>
                      <button
                        onClick={() => removeStockItem(index)}
                        className="btn btn-danger"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="billing-footer">
        <h3>Total Amount: ₹{total}</h3>
        <div className="button-group">
          <button 
            onClick={handlePrint} 
            className="btn btn-primary"
            disabled={saving}
          >
            Print Bill
          </button>
          <button 
            onClick={handleSaveBill} 
            className="btn btn-success"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Bill'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billing; 