import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import UserRegistration from './components/UserRegistration';
import CreateService from './components/CreateService';
import CreateReservation from './components/CreateReservation';
import UserList from './components/UserList';
import ServiceList from './components/ServiceList';
import ReservationList from './components/ReservationList';
import SuccessPage from './components/SuccessPage';
import ErrorPage from './components/ErrorPage';
import UpdateReservationStatus from './components/UpdateReservationStatus';
import EmployeeOnboarding from './components/EmployeeOnboarding';
import EmployeeOnboardingComplete from './components/EmployeeOnboardingComplete';
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
            gap: '1.5rem',
            margin: 0,
            padding: 0,
            flexWrap: 'wrap'
          }}>
            <li>
              <Link to="/register" style={{ textDecoration: 'none', color: '#5469d4' }}>
                Register User
              </Link>
            </li>
            <li>
              <Link to="/users" style={{ textDecoration: 'none', color: '#5469d4' }}>
                View Users
              </Link>
            </li>
            <li>
              <Link to="/create-service" style={{ textDecoration: 'none', color: '#5469d4' }}>
                Create Service
              </Link>
            </li>
            <li>
              <Link to="/services" style={{ textDecoration: 'none', color: '#5469d4' }}>
                View Services
              </Link>
            </li>
            <li>
              <Link to="/create-reservation" style={{ textDecoration: 'none', color: '#5469d4' }}>
                Create Reservation
              </Link>
            </li>
            <li>
              <Link to="/reservations" style={{ textDecoration: 'none', color: '#5469d4' }}>
                View Reservations
              </Link>
            </li>
            <li>
              <Link to="/update-reservation" style={{ textDecoration: 'none', color: '#5469d4' }}>
                Update Reservation Status
              </Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/register" element={<UserRegistration />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/create-service" element={<CreateService />} />
          <Route path="/services" element={<ServiceList />} />
          <Route path="/create-reservation" element={<CreateReservation />} />
          <Route path="/reservations" element={<ReservationList />} />
          <Route path="/employee-onboarding/start/:userId" element={<EmployeeOnboarding />} />
          <Route path="/employee-onboarding/refresh" element={<EmployeeOnboardingComplete />} />
          <Route path="/employee-onboarding/complete" element={<EmployeeOnboardingComplete />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/update-reservation" element={<UpdateReservationStatus />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;