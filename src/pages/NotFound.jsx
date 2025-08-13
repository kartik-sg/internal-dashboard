import { Link } from "react-router";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-24">
      <h1 className="text-6xl font-bold text-white mb-4">404</h1>
      <p className="text-gray-300 mb-8">Page not found</p>
      <Link
        to="/"
        className="inline-block px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
      >
        Go home
      </Link>
    </div>
  );
}

export default NotFound;


