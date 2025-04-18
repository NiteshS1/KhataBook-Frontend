import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import API_CONFIG from '../config/api';

const Stocks = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    price: '',
    description: ''
  });
  const [editingStock, setEditingStock] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch(API_CONFIG.STOCKS.BASE, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to fetch stocks');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setStocks(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch stocks');
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      setError('Failed to fetch stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStock && !editingStock._id) {
        toast.error('Invalid stock ID');
        return;
      }

      const url = editingStock
        ? API_CONFIG.STOCKS.BY_ID(editingStock._id)
        : API_CONFIG.STOCKS.BASE;

      // Format the request data
      const requestData = {
        productName: formData.productName,
        quantity: parseInt(formData.quantity),
        price: parseInt(formData.price),
        description: formData.description || ''
      };

      const response = await fetch(url, {
        method: editingStock ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingStock ? 'Stock updated successfully' : 'Stock added successfully');
        setShowModal(false);
        fetchStocks();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError('Failed to save stock');
    }
  };

  const handleDelete = async (stock) => {
    if (!stock || !stock._id) {
      toast.error('Invalid stock data');
      return;
    }

    if (window.confirm('Are you sure you want to delete this stock?')) {
      try {
        const response = await fetch(API_CONFIG.STOCKS.BY_ID(stock._id), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Stock deleted successfully');
          fetchStocks();
        } else {
          toast.error(data.message || 'Failed to delete stock');
        }
      } catch (error) {
        console.error('Delete error:', error);
        setError('Failed to delete stock');
      }
    }
  };

  const handleEdit = (stock) => {
    if (!stock || !stock._id) {
      toast.error('Invalid stock data');
      return;
    }
    setEditingStock(stock);
    setFormData({
      productName: stock.productName,
      quantity: stock.quantity,
      price: stock.price,
      description: stock.description || ''
    });
    setShowModal(true);
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="stocks">
      <div className="flex justify-between items-center mb-4">
        <h1>Stocks</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingStock(null);
            setFormData({
              productName: '',
              quantity: '',
              price: '',
              description: ''
            });
            setShowModal(true);
          }}
        >
          Add Stock
        </button>
      </div>

      <div className="card">
        {stocks.length === 0 ? (
          <p className="text-center">No stocks found</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => (
                <tr key={index}>
                  <td>{stock.productName}</td>
                  <td>{stock.quantity}</td>
                  <td>₹{stock.price}</td>
                  <td>{stock.description || '-'}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary mr-2"
                      onClick={() => handleEdit(stock)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(stock)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingStock ? 'Edit Stock' : 'Add Stock'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="productName">Product Name</label>
                <input
                  type="text"
                  id="productName"
                  className="form-control"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  className="form-control"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="price">Price</label>
                <input
                  type="number"
                  id="price"
                  className="form-control"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="btn btn-secondary mr-2"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStock ? 'Update' : 'Add'} Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stocks; 