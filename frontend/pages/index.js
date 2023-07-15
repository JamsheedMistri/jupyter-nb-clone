import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
	const { isLoggedIn, logout } = useContext(AuthContext);
	const [notebooks, setNotebooks] = useState([]);
	const [filename, setFilename] = useState('');
	const [banner, setBanner] = useState('');
	const [error, setError] = useState('');

	useEffect(() => {
		if (isLoggedIn) fetchNotebooks();
	}, [isLoggedIn]);

	const fetchNotebooks = async () => {
		try {
			const response = await axios.get('http://localhost:8000/notebooks');
			setNotebooks(response.data);
		} catch (error) {
			setError('Error fetching notebooks: ' + error.response.data.detail);
		}
	};

	const createNotebook = async () => {
		if (!filename) return;

		try {
			const response = await axios.post('http://localhost:8000/notebooks', {
				filename,
			});
			const createdNotebook = response.data;
			console.log(createdNotebook);
			setNotebooks([...notebooks, createdNotebook]);
			setFilename('');
		} catch (error) {
			setError('Error creating notebook: ' + error.response.data.detail);
		}
	};

	const deleteNotebook = async (id) => {
		try {
			const response = await axios.delete(
				`http://localhost:8000/notebooks/${id}`
			);
			setNotebooks(notebooks.filter((notebook) => notebook.id != id));
			setBanner(response.data.message);
		} catch (error) {
			setError('Error deleting notebook: ' + error.response.data.detail);
		}
	};

	return (
		<div>
			<header className="flex justify-between items-center p-4">
				<h1>Notebooks</h1>
				{banner && (
					<div className="inline-block bg-blue-500 text-white px-4 py-2">
						{banner}
					</div>
				)}
				{error && (
					<div className="inline-block bg-red-500 text-white px-4 py-2">
						{error}
					</div>
				)}

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
						<button
							className="bg-blue-500 text-white px-4 py-2"
							onClick={createNotebook}
						>
							Create Notebook
						</button>
					</div>

					<ul>
						{notebooks.map((notebook) => (
							<li key={notebook.id}>
								<Link
									href={`/notebooks/${notebook.id}`}
									className="text-blue-500"
								>
									{notebook.filename}
								</Link>
								<button onClick={() => deleteNotebook(notebook.id)}>
									Delete
								</button>
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
