import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
	const router = useRouter();

	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		const token = localStorage.getItem('access_token');
		if (token) {
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
			setIsLoggedIn(true);
		} else {
			setIsLoggedIn(false);
		}
	}, []);

	const saveAccessTokenAndRedirect = (access_token) => {
		if (access_token) {
			localStorage.setItem('access_token', access_token);
			axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
			setIsLoggedIn(true);
			router.push('/');
		}
	};

	const logout = () => {
		localStorage.removeItem('access_token');
		delete axios.defaults.headers.common['Authorization'];
		setIsLoggedIn(false);
		router.push('/login');
	};

	return (
		<AuthContext.Provider
			value={{
				isLoggedIn,
				saveAccessTokenAndRedirect,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
