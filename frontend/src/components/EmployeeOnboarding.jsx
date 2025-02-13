import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EmployeeOnboarding() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { userId } = useParams();

    useEffect(() => {
        if (!userId) {
            setError('No user ID provided');
            setLoading(false);
            return;
        }
        createConnectAccount();
    }, [userId]);

    const createConnectAccount = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/employees/create-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create Stripe account');
            }

            // Redirect to Stripe onboarding
            window.location.href = data.url;
        } catch (err) {
            console.error('Onboarding error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ 
                padding: '20px',
                maxWidth: '800px',
                margin: '0 auto',
                textAlign: 'center'
            }}>
                <h2>Setting up your account...</h2>
                <p>Please wait while we prepare your Stripe account.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ 
                padding: '20px',
                maxWidth: '800px',
                margin: '0 auto',
                textAlign: 'center'
            }}>
                <h2>Error</h2>
                <p style={{ color: '#dc3545', marginBottom: '20px' }}>{error}</p>
                <button
                    onClick={() => navigate('/users')}
                    style={{
                        backgroundColor: '#5469d4',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Back to Users
                </button>
            </div>
        );
    }

    return null;
}

export default EmployeeOnboarding;
