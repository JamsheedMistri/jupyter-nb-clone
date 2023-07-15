import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
	const router = useRouter();

	const [notebooks, setNotebooks] = useState([]);
	const [filename, setFilename] = useState('');
	const [content, setContent] = useState('');
	const [isLoggedIn, setIsLoggedIn] = useState(false); // New state variable

	useEffect(() => {
		checkLoginStatus(); // Check login status when component mounts
	}, []);

	const fetchNotebooks = async () => {
		try {
			const response = await axios.get('http://localhost:8000/notebooks');
			setNotebooks(response.data);
			console.log(response.data);
		} catch (error) {
			console.error('Error fetching notebooks:', error);
		}
	};

	const createNotebook = async () => {
		if (!filename || !content) return;

		try {
			const response = await axios.post('http://localhost:8000/notebooks', {
				filename,
				content,
			});
			const createdNotebook = response.data;
			setNotebooks([...notebooks, createdNotebook]);
			setFilename('');
			setContent('');
		} catch (error) {
			console.error('Error creating notebook:', error);
		}
	};

	const logout = () => {
		localStorage.removeItem('access_token');
		delete axios.defaults.headers.common['Authorization'];
		setIsLoggedIn(false); // Update isLoggedIn state
		router.push('/login');
	};

	const checkLoginStatus = () => {
		const token = localStorage.getItem('access_token');
		if (token) {
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
			setIsLoggedIn(true);
			fetchNotebooks();
		} else {
			setIsLoggedIn(false);
		}
	};

	return (
		<div>
			<header className="flex justify-between items-center p-4">
				<h1>Notebooks</h1>

				<div>
					{isLoggedIn ? (
						<button
							className="bg-red-500 text-white px-4 py-2"
							onClick={logout}
						>
							Logout
						</button>
					) : (
						<>
							<Link
								href="/signup"
								className="bg-green-500 text-white px-4 py-2 mr-2"
							>
								Signup
							</Link>
							<Link href="/login" className="bg-blue-500 text-white px-4 py-2">
								Login
							</Link>
						</>
					)}
				</div>
			</header>

			{isLoggedIn ? ( // Use isLoggedIn state instead of accessing localStorage directly
				<div className="p-4">
					<div className="mb-4">
						<input
							type="text"
							className="border border-gray-300 p-2 mr-2"
							placeholder="Filename"
							value={filename}
							onChange={(e) => setFilename(e.target.value)}
						/>
						<input
							type="text"
							className="border border-gray-300 p-2 mr-2"
							placeholder="Content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
						/>
						<button
							className="bg-blue-500 text-white px-4 py-2"
							onClick={createNotebook}
						>
							Create Notebook
						</button>
					</div>

					<ul>
						{notebooks.map((notebook, idx) => (
							<li key={idx}>
								<Link
									href={`/notebooks/${notebook.id}`}
									className="text-blue-500"
								>
									{notebook.filename}
								</Link>
							</li>
						))}
					</ul>
				</div>
			) : (
				<div className="p-4">
					<h3>Not logged in</h3>
				</div>
			)}
		</div>
	);
}
