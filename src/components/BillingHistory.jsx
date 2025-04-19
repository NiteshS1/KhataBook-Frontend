import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_CONFIG from '../config/api';
import { toast } from 'react-toastify';
import './BillingHistory.css';

const BillingHistory = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(API_CONFIG.ORDERS.BASE, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.message || 'Failed to fetch orders');
          return;
        }

        const data = await response.json();
        setOrders(data.data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch orders');
      } finally {
        setLoadingOrders(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  if (loading || !user) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = (orderId) => {
    // Hide all elements except the selected order
    const allOrders = document.querySelectorAll('.order-card');
    allOrders.forEach(order => {
      if (order.id !== `order-${orderId}`) {
        order.style.display = 'none';
      }
    });

    // Print the page
    window.print();

    // Show all orders again after printing
    setTimeout(() => {
      allOrders.forEach(order => {
        order.style.display = 'block';
      });
    }, 1000);
  };

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="billing-history-container">
      <div className="billing-history-header">
        <h2 className="billing-history-title">Billing History</h2>
        <div className="billing-history-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button onClick={() => handlePrint(filteredOrders[0]._id)} className="btn btn-primary print-btn">
            Print History
          </button>
        </div>
      </div>

      {loadingOrders ? (
        <div className="loading">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="no-orders">
          {searchTerm ? 'No orders found matching your search' : 'No orders found'}
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div key={order._id} id={`order-${order._id}`} className="order-card">
              <div className="order-header">
                <div className="customer-info">
                  <h3>{order.customerName}</h3>
                  <p>{order.phoneNumber}</p>
                </div>
                <div className="order-meta">
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                  <span className="order-total">₹{order.finalTotal}</span>
                  <button 
                    onClick={() => handlePrint(order._id)} 
                    className="btn btn-primary print-btn"
                  >
                    Print Bill
                  </button>
                </div>
              </div>

              <div className="order-items">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.itemName}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.price}</td>
                        <td>₹{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingHistory; 