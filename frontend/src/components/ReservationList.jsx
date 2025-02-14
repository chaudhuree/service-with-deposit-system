import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: '#721c24',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          margin: '20px'
        }}>
          <h2>Something went wrong.</h2>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginTop: '10px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function ReservationList() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reservations');
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      const data = await response.json();
      console.log('Fetched reservations:', data); // Debug log
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reservation status');
      }

      // Refresh the reservations list
      fetchReservations();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h2>Loading reservations...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
        <h2>Error: {error}</h2>
        <button
          onClick={fetchReservations}
          style={{
            padding: '10px 20px',
            backgroundColor: '#5469d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginTop: '10px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Reservations</h2>
        <Link 
          to="/create-reservation"
          style={{
            backgroundColor: '#5469d4',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          Create New Reservation
        </Link>
      </div>

      {reservations.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <p style={{ fontSize: '18px', color: '#6c757d' }}>No reservations found</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={tableHeaderStyle}>Service</th>
                <th style={tableHeaderStyle}>Customer</th>
                <th style={tableHeaderStyle}>Employee</th>
                <th style={tableHeaderStyle}>Amount</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>ReservationID</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={tableCellStyle}>
                    {reservation.serviceId?.name || 'N/A'}
                  </td>
                  <td style={tableCellStyle}>
                    {reservation.userId?.name || 'N/A'}
                  </td>
                  <td style={tableCellStyle}>
                    {reservation.employeeId || 'N/A'}
                  </td>
                  <td style={tableCellStyle}>
                    ${reservation.amount || 0}
                  </td>
                  <td style={tableCellStyle}>
                    <span style={getStatusStyle(reservation.status)}>
                      {reservation.status || 'pending'}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    {reservation._id || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #dee2e6',
  backgroundColor: '#f8f9fa'
};

const tableCellStyle = {
  padding: '12px',
  textAlign: 'left'
};

const getStatusStyle = (status) => {
  const baseStyle = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.875rem'
  };

  const colors = {
    pending: { background: '#fff3cd', color: '#856404' },
    confirmed: { background: '#cce5ff', color: '#004085' },
    completed: { background: '#d4edda', color: '#155724' },
    cancelled: { background: '#f8d7da', color: '#721c24' }
  };

  return {
    ...baseStyle,
    ...(colors[status] || colors.pending)
  };
};

// Wrap the ReservationList with ErrorBoundary
export default function ReservationListWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <ReservationList />
    </ErrorBoundary>
  );
}
