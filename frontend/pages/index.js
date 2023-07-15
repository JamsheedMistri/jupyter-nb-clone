import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';

export default function Home() {
	const { isLoggedIn, logout } = useContext(AuthContext);
	const [notebooks, setNotebooks] = useState([]);
	const [filename, setFilename] = useState('');
	const [banner, setBanner] = useState('');

	useEffect(() => {
		if (isLoggedIn) fetchNotebooks();
	}, [isLoggedIn]);

	const fetchNotebooks = async () => {
		try {
			const response = await axios.get('http://localhost:8000/notebooks');
			setNotebooks(response.data);
		} catch (error) {
			if (error.response.status == 401) logout();
			setBanner('Error fetching notebooks: ' + error.response.data.detail);
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
			if (error.response.status == 401) logout();
			setBanner('Error creating notebook: ' + error.response.data.detail);
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
			if (error.response.status == 401) logout();
			setBanner('Error deleting notebook: ' + error.response.data.detail);
		}
	};

	return (
		<div>
			<Navbar />
			<Banner message={banner} />

			{isLoggedIn ? (
				<div className="p-4">
					<div className="mb-4">
						<input
							type="text"
							className="border border-gray-300 p-2 mr-2"
							placeholder="File name"
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

					<table className="border border-gray-300">
						<thead className="bg-gray-200 text-left">
							<tr>
								<th className="w-11/12 px-4 py-2">File name</th>
								<th className="w-1/12 px-4 py-2">Actions</th>
							</tr>
						</thead>
						<tbody>
							{notebooks.map((notebook) => (
								<tr key={notebook.id}>
									<td className="px-4 py-2">
										<Link
											href={`/notebooks/${notebook.id}`}
											className="text-blue-500"
										>
											{notebook.filename}
										</Link>
									</td>
									<td className="px-4 py-2 text-left">
										<button
											className="bg-red-500 text-white px-4 py-2"
											onClick={() => deleteNotebook(notebook.id)}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="p-4">
					<h3>
						Welcome to <b>Jupypter Notebook Clone</b>! Log in or sign up to get
						started.
					</h3>
				</div>
			)}
		</div>
	);
}
