import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function EmployeeOnboardingComplete() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // After successful onboarding or refresh, redirect to users page
        setTimeout(() => {
            navigate('/users');
        }, 3000);
    }, [navigate]);

    return (
        <div style={{ 
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto',
            textAlign: 'center'
        }}>
            <h2>Setup Complete!</h2>
            <p style={{ color: '#28a745', marginBottom: '20px' }}>
                Your account setup was successful. You can now receive payments for your services.
            </p>
            <p>Redirecting you to the users page...</p>
        </div>
    );
}

export default EmployeeOnboardingComplete;
