export default function Banner({ message }) {
	return (
		message && (
			<div className="table text-center bg-red-500 text-white mx-auto my-2 px-4 py-2">
				{message}
			</div>
		)
	);
}
