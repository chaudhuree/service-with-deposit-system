import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function UserRegistration() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch('http://localhost:5000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to register user');
            }

            setSuccess(true);
            setName('');
            setEmail('');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Register User</h2>
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Name:
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                        Email:
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                        }}
                    />
                </div>

                {error && (
                    <div style={{ 
                        marginBottom: '20px',
                        padding: '10px',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        color: '#721c24'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{ 
                        marginBottom: '20px',
                        padding: '10px',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        color: '#155724'
                    }}>
                        User registered successfully!
                    </div>
                )}

                <button
                    type="submit"
                    style={{
                        backgroundColor: '#5469d4',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    Register User
                </button>
            </form>
        </div>
    );
}

export default UserRegistration;