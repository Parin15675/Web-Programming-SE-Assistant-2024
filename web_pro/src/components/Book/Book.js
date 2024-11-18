import React, { useState, useEffect } from "react";
import axios from "axios";
import UploadFile from "./UploadFile";
import Nav from "../Nav";

function Book() {
  const [booksByYear, setBooksByYear] = useState({
    year1: [],
    year2: [],
    year3: [],
    year4: [],
  });
  const [selectedBook, setSelectedBook] = useState(null);

  const fetchBooks = async () => {
    try {
      const year1 = await axios.get("http://localhost:8000/books/1");
      const year2 = await axios.get("http://localhost:8000/books/2");
      const year3 = await axios.get("http://localhost:8000/books/3");
      const year4 = await axios.get("http://localhost:8000/books/4");

      setBooksByYear({
        year1: year1.data,
        year2: year2.data,
        year3: year3.data,
        year4: year4.data,
      });
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleBookClick = (bookId, year) => {
    setSelectedBook({ id: bookId, year });
  };

  const handleCloseViewer = () => {
    setSelectedBook(null);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-orange-400 to-red-500">
      <Nav />
      <div className="container mx-auto py-20 pt-32">
        <h1 className="text-center text-4xl font-bold text-white mb-8 drop-shadow-lg">
          Book Hub
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6">
          {/* Left Column: Upload Section */}
          <div className="bg-white shadow-lg rounded-lg p-6 transform transition hover:scale-105">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Upload Books
            </h2>
            <UploadFile onUploadSuccess={fetchBooks} />
          </div>

          {/* Right Column: Book Hub */}
          <div>
            <div className="grid grid-cols-1 gap-8">
              {["year1", "year2", "year3", "year4"].map((yearKey, index) => (
                <div
                  key={index}
                  className="bg-white shadow-lg rounded-lg p-6 transform transition hover:scale-105"
                >
                  <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    Year {index + 1}
                  </h2>
                  <ul className="space-y-2">
                    {booksByYear[yearKey].map((book) => (
                      <li
                        key={book.id}
                        className="text-blue-500 hover:text-blue-700 cursor-pointer font-medium"
                        onClick={() => handleBookClick(book.id, index + 1)}
                      >
                        {book.filename}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Viewer Section */}
        {selectedBook && (
          <div className="mt-10 px-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Viewing Book</h2>
              <button
                onClick={handleCloseViewer}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition hover:scale-105"
              >
                Close Viewer
              </button>
            </div>
            <iframe
              src={`http://localhost:8000/books/${selectedBook.year}/${selectedBook.id}`}
              width="100%"
              height="800px"
              className="rounded-lg shadow-lg"
              title="Book Viewer"
            ></iframe>
          </div>
        )}
      </div>
    </div>
  );
}

export default Book;
