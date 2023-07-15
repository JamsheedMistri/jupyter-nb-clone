import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function Notebook() {
	const router = useRouter();
	const { id } = router.query;

	const [filename, setFilename] = useState('');
	const [content, setContent] = useState('');

	useEffect(() => {
		if (id) {
			fetchNotebook();
		}
	}, [id]);

	const fetchNotebook = async () => {
		try {
			const response = await axios.get(`http://localhost:8000/notebooks/${id}`);
			setFilename(response.data.filename);
			setContent(response.data.content);
		} catch (error) {
			console.error('Error fetching notebook:', error);
		}
	};

	const updateNotebook = async () => {
		if (!filename || !content) return;

		try {
			const response = await axios.put(
				`http://localhost:8000/notebooks/${id}`,
				{
					filename,
					content,
				}
			);
			const updatedNotebook = response.data;
		} catch (error) {
			console.error('Error updating notebook:', error);
		}
	};

	const deleteNotebook = async () => {
		try {
			await axios.delete(`http://localhost:8000/notebooks/${id}`);
			router.push('/');
		} catch (error) {
			console.error('Error deleting notebook:', error);
		}
	};

	return (
		<div>
			<div className="mb-4">
				<input
					type="text"
					className="border border-gray-300 p-2 mr-2"
					value={filename}
					onChange={(e) => setFilename(e.target.value)}
				/>
				<textarea
					className="block border border-gray-300 p-2 mr-2"
					value={content}
					onChange={(e) => setContent(e.target.value)}
				/>
				<button
					className="bg-blue-500 text-white px-4 py-2"
					onClick={updateNotebook}
				>
					Save
				</button>
				<button
					className="bg-red-500 text-white px-4 py-2 ml-2"
					onClick={deleteNotebook}
				>
					Delete
				</button>
			</div>
		</div>
	);
}
