import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
	const { isLoggedIn, logout } = useContext(AuthContext);

	return (
		<header className="flex justify-between items-center p-4 bg-gray-700">
			<Link href="/">
				<h1 className="text-white">Jupyter Notebook Clone</h1>
			</Link>

			<div>
				{isLoggedIn ? (
					<button className="bg-red-500 text-white px-4 py-2" onClick={logout}>
						Log Out
					</button>
				) : (
					<>
						<Link
							href="/signup"
							className="bg-green-500 text-white px-4 py-2 mr-2"
						>
							Sign Up
						</Link>
						<Link href="/login" className="bg-blue-500 text-white px-4 py-2">
							Log In
						</Link>
					</>
				)}
			</div>
		</header>
	);
}
