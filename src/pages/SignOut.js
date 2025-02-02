import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doLogout } from '../api';

const SignOut = ({ onLogout }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const logout = async () => {
            try {
                const response = await doLogout();
                console.log(response)

                if (response.status >= 200 && response.status < 300) {
                    onLogout(); // Clear user session state
                    navigate('/login'); // Redirect to login
                } else {
                    console.error('Logout failed');
                }
            } catch (error) {
                console.error('An error occurred during logout:', error);
            }
        };

        logout();
    }, [navigate, onLogout]);


};

export default SignOut;
