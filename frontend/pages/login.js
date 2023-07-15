import { useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';

export default function Login() {
	const { saveAccessTokenAndRedirect } = useContext(AuthContext);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [banner, setBanner] = useState(null);

	const login = async (e) => {
		e.preventDefault();

		try {
			const response = await axios.post('http://localhost:8000/auth/token', {
				email,
				password,
			});

			if (response.status === 200) {
				saveAccessTokenAndRedirect(response.data.access_token);
			}
		} catch (error) {
			setBanner(error.response.data.detail);
		}
	};

	return (
		<div>
			<Navbar />
			<Banner message={banner} />

			<div className="p-4">
				<h1 className="text-2xl font-bold mb-4">Log In</h1>

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
						Log In
					</button>
				</form>
			</div>
		</div>
	);
}
