import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import UserRegistration from './components/UserRegistration';
import CreateService from './components/CreateService';
import CreateReservation from './components/CreateReservation';
import SuccessPage from './components/SuccessPage';
import ErrorPage from './components/ErrorPage';
import UpdateReservationStatus from './components/UpdateReservationStatus';
import ReleasePayment from './components/ReleasePayment';
import './App.css';

function App() {
  return (
    <Router>
      <div>
        <nav style={{
          backgroundColor: '#f8f9fa',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <ul style={{
            listStyle: 'none',
            display: 'flex',
            gap: '2rem',
            margin: 0,
            padding: 0
          }}>
            <li>
              <Link to="/register" style={{ textDecoration: 'none', color: '#5469d4' }}>
                Register User
              </Link>
            </li>
            <li>
              <Link to="/create-service" style={{ textDecoration: 'none', color: '#5469d4' }}>
                Create Service
              </Link>
            </li>
            <li>
              <Link to="/create-reservation" style={{ textDecoration: 'none', color: '#5469d4' }}>
                Create Reservation
              </Link>
            </li>
            <li>
              <Link to="/update-reservation" style={{ textDecoration: 'none', color: '#5469d4' }}>
                Update Reservation Status
              </Link>
            </li>
            <li>
              <Link to="/release-payment" style={{ textDecoration: 'none', color: '#5469d4' }}>
                Release Payment
              </Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/register" element={<UserRegistration />} />
          <Route path="/create-service" element={<CreateService />} />
          <Route path="/create-reservation" element={<CreateReservation />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/update-reservation" element={<UpdateReservationStatus />} />
          <Route path="/release-payment" element={<ReleasePayment />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;