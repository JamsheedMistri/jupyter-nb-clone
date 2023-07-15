import { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { AuthContext } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Banner from '../../components/Banner';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(
	() => import('@uiw/react-md-editor').then((mod) => mod.default),
	{ ssr: false }
);

export default function Notebook() {
	const router = useRouter();
	const { id } = router.query;

	const { isLoggedIn, logout } = useContext(AuthContext);

	const [filename, setFilename] = useState('');
	const [content, setContent] = useState('');
	const [output, setOutput] = useState('');
	const [banner, setBanner] = useState('');

	useEffect(() => {
		if (id && isLoggedIn) {
			fetchNotebook();
		}
	}, [id, isLoggedIn]);

	const fetchNotebook = async () => {
		try {
			const response = await axios.get(`http://localhost:8000/notebooks/${id}`);
			console.log(response.data)
			setFilename(response.data.filename);
			setContent(response.data.content);
			setOutput(response.data.latest_run);
		} catch (error) {
			if (error.response.status == 401) logout();
			setBanner('Error fetching notebook:' + error);
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
			if (error.response.status == 401) logout();
			setBanner('Error updating notebook:' + error);
		}
	};

	const deleteNotebook = async () => {
		try {
			await axios.delete(`http://localhost:8000/notebooks/${id}`);
			router.push('/');
		} catch (error) {
			if (error.response.status == 401) logout();
			setBanner('Error deleting notebook:' + error);
		}
	};

	const runNotebook = async () => {
		await updateNotebook();
		try {
			const response = await axios.post(`http://localhost:8000/notebooks/${id}/run`);
			setOutput(response.data.output);
		} catch (error) {
			if (error.response.status == 401) logout();
			setBanner('Error running notebook:' + error);
		}

	};

	return (
		<div>
			<Navbar />
			<div className="p-4">
				<button
					className="bg-green-500 text-white px-4 py-2"
					onClick={runNotebook}
				>
					Run
				</button>
				<button
					className="bg-blue-500 text-white px-4 ml-2 py-2"
					onClick={updateNotebook}
				>
					Save
				</button>
				<button
					className="bg-red-500 text-white px-4 py-2 ml-2 mb-2"
					onClick={deleteNotebook}
				>
					Delete
				</button>
				<label className="block">File name</label>
				<input
					type="text"
					className="block border border-gray-300 p-2 mb-2 w-full"
					value={filename}
					placeholder="File name"
					onChange={(e) => setFilename(e.target.value)}
				/>
				<label className="block">Code</label>
				<div data-color-mode="light" className="mb-2">
					<MDEditor value={content} onChange={setContent} height={450} />
				</div>
				<label className="block">Output</label>
				<div className="w-full bg-gray-200 h-48 p-2 overflow-y-scroll font-mono text-black whitespace-pre-wrap">{output}</div>
			</div>
		</div>
	);
}
