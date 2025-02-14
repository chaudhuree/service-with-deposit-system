import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51Qp5LOPs8mVJ1TARXPGnFhtXqSGxyInN2qfw2Suc8Uc9UT4iDcYC90XHcCWjViiqsIidXKA1sSoHEE68SdBXvR8000d6SXeuJa');

function CheckoutForm({ userId, serviceId, employeeId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          serviceId,
          employeeId,
          paymentMethodId: paymentMethod.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create reservation');
      }

      onSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Payment Details</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '10px 0' }}>
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }} />
        </div>
        {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
        <button 
          type="submit" 
          disabled={!stripe || processing}
          style={{
            backgroundColor: '#5469d4',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '4px',
            border: 'none',
            marginTop: '20px',
            cursor: processing ? 'not-allowed' : 'pointer',
            opacity: processing ? 0.7 : 1,
            width: '100%',
            fontSize: '16px'
          }}
        >
          {processing ? 'Processing...' : 'Pay and Book'}
        </button>
      </form>
    </div>
  );
}

function CreateReservation() {
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
    fetchUsers();
    fetchEmployees();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data.filter(user => user.role === 'user'));
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setEmployees(data.filter(user => user.role === 'employee' && user.accountSetupComplete));
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
    }
  };

  const handleSuccess = (data) => {
    setSuccess(true);
    setTimeout(() => {
      navigate('/reservations');
    }, 2000);
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h2 style={{ color: '#4CAF50' }}>Reservation Created Successfully!</h2>
        <p>Redirecting to reservations list...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Create Reservation</h2>
      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Select Service:
          <select 
            value={selectedService} 
            onChange={(e) => setSelectedService(e.target.value)}
            style={{ 
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Choose a service...</option>
            {services.map(service => (
              <option key={service._id} value={service._id}>
                {service.name} - ${service.price}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Select User:
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            style={{ 
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Choose a user...</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Select Employee:
          <select 
            value={selectedEmployee} 
            onChange={(e) => setSelectedEmployee(e.target.value)}
            style={{ 
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">Choose an employee...</option>
            {employees.map(employee => (
              <option key={employee._id} value={employee._id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedService && selectedUser && selectedEmployee && (
        <Elements stripe={stripePromise}>
          <CheckoutForm
            userId={selectedUser}
            serviceId={selectedService}
            employeeId={selectedEmployee}
            onSuccess={handleSuccess}
          />
        </Elements>
      )}
    </div>
  );
}

export default CreateReservation;
