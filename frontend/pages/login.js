import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Login() {
	const router = useRouter();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState(null);

	const login = async (e) => {
		e.preventDefault();

		try {
			const response = await axios.post('http://localhost:8000/auth/token', {
				email,
				password,
			});
			if (response.status === 200) {
				const { access_token } = response.data;
				if (access_token) {
					localStorage.setItem('access_token', access_token);
					axios.defaults.headers.common[
						'Authorization'
					] = `Bearer ${access_token}`;
					router.push('/');
				}
			}
		} catch (error) {
			setError(error.response.data.detail); // Handle login error
		}
	};

	return (
		<div>
			<h1>Login</h1>
			{error && (
				<div className="inline-block bg-red-500 text-white px-4 py-2">
					Error: {error}
				</div>
			)}

			<form onSubmit={login}>
				<div className="mb-4">
					<label className="block">Email</label>
					<input
						type="email"
						className="border border-gray-300 p-2 w-full"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</div>
				<div className="mb-4">
					<label className="block">Password</label>
					<input
						type="password"
						className="border border-gray-300 p-2 w-full"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</div>
				<button className="bg-blue-500 text-white px-4 py-2" type="submit">
					Login
				</button>
			</form>
		</div>
	);
}
