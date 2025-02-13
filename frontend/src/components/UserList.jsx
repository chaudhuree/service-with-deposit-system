import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users');
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch users');
            }
            
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOnboardingClick = (userId) => {
        navigate(`/employee-onboarding/start/${userId}`);
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            Loading users...
        </div>
    );

    if (error) return (
        <div style={{ 
            padding: '20px',
            color: '#721c24',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
        }}>
            Error: {error}
        </div>
    );

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Registered Users</h2>
            
            <div style={{ 
                display: 'grid', 
                gap: '15px',
                gridTemplateColumns: '1fr',
            }}>
                {users.map(user => (
                    <div key={user._id} style={{
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        border: '1px solid #dee2e6'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px'
                        }}>
                            <h3 style={{ margin: '0' }}>{user.name}</h3>
                            {user.role === 'employee' && !user.accountSetupComplete && (
                                <button
                                    onClick={() => handleOnboardingClick(user._id)}
                                    style={{
                                        backgroundColor: '#5469d4',
                                        color: 'white',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Setup Payment Account
                                </button>
                            )}
                        </div>
                        <div style={{ color: '#666' }}>
                            <p style={{ margin: '5px 0' }}>ID: {user._id}</p>
                            <p style={{ margin: '5px 0' }}>Email: {user.email}</p>
                            <p style={{ margin: '5px 0' }}>
                                Role: <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: user.role === 'employee' ? '#e3f2fd' : '#f3e5f5',
                                    color: user.role === 'employee' ? '#1976d2' : '#9c27b0'
                                }}>
                                    {user.role}
                                </span>
                            </p>
                            {user.role === 'employee' && (
                                <p style={{ margin: '5px 0' }}>
                                    Account Status: <span style={{
                                        color: user.accountSetupComplete ? '#28a745' : '#dc3545'
                                    }}>
                                        {user.accountSetupComplete ? 'Ready to receive payments' : 'Setup required'}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {users.length === 0 && (
                <div style={{ 
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    marginTop: '20px'
                }}>
                    No users found
                </div>
            )}
        </div>
    );
}

export default UserList;
