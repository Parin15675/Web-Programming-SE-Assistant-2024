import React, { useState, useEffect } from "react";
import axios from "axios";
import UploadFile from "./UploadFile";
import Nav from "../Nav";
import * as pdfjs from "pdfjs-dist/webpack"; // Correct import

function Book() {
  const [booksByYear, setBooksByYear] = useState({
    year1: [],
    year2: [],
    year3: [],
    year4: [],
  });
  const [selectedBook, setSelectedBook] = useState(null);
  const [thumbnails, setThumbnails] = useState({});
  const [uploadYear, setUploadYear] = useState(null); // State to track which year to show upload form
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const [yearClicked, setYearClicked] = useState(null);

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

  const loadPdfThumbnail = async (url) => {
    try {
      const pdf = await pdfjs.getDocument(url).promise;
      const page = await pdf.getPage(1); // Get the first page
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      // Set up the canvas size to match the PDF page's size
      const viewport = page.getViewport({ scale: 0.2 }); // Scale to make it a thumbnail
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render the first page of the PDF into the canvas
      await page.render({ canvasContext: context, viewport: viewport }).promise;

      return canvas.toDataURL(); // Return the base64 encoded image
    } catch (error) {
      console.error("Error loading PDF thumbnail:", error);
      return null;
    }
  };

  const generateThumbnails = async () => {
    const newThumbnails = {};
    for (const yearKey in booksByYear) {
      for (const book of booksByYear[yearKey]) {
        const url = `http://localhost:8000/books/${yearKey.slice(-1)}/${
          book.id
        }`;
        const thumbnail = await loadPdfThumbnail(url);
        newThumbnails[book.id] = thumbnail;
      }
    }
    setThumbnails(newThumbnails);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (Object.keys(booksByYear).length > 0) {
      generateThumbnails();
    }
  }, [booksByYear]);

  const handleBookClick = (bookId, year) => {
    setSelectedBook({ id: bookId, year });
  };

  const handleCloseViewer = () => {
    setSelectedBook(null);
  };

  const handleUploadButtonClick = (year) => {
    setUploadYear(year); // Set the year for upload
    setShowModal(true); // Show the modal
  };

  const closeModal = () => {
    setShowModal(false); // Close the modal
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-sky-200 via-white to-sky-100">
      <Nav />
      <div className="container mx-auto py-20 pt-32">
        <div className="bg-coursebg p-6 rounded-lg text-center text-white mb-8">
          <h1 className="text-4xl font-extrabold text-white">Book Hub</h1>
        </div>

        {/* Viewer Section */}
        {selectedBook && (
          <div className="mt-10 px-6 mb-8">
            {" "}
            {/* Added mb-8 for bottom margin */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Viewing{" "}
                {
                  booksByYear[`year${selectedBook.year}`].find(
                    (book) => book.id === selectedBook.id
                  )?.filename
                }
              </h2>
              <button
                onClick={handleCloseViewer}
                className="bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition hover:scale-105"
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

        <div className="grid grid-cols-1 gap-8 px-6">
          {/* Right Column: Book Hub */}
          <div className="w-full">
            <div className="space-y-8">
              {["year1", "year2", "year3", "year4"].map((yearKey, index) => (
                <div key={index} className="bg-white shadow-lg rounded-lg p-6 ">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-semibold text-gray-700 mb-4 text-center w-full">
                      Year {index + 1}
                    </h2>
                    <button
                      className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-600"
                      onClick={() => handleUploadButtonClick(index + 1)}
                    >
                      <span className="text-4xl font-bold translate-y-[-3.5px] translate-x-[-0.5px]">
                        +
                      </span>
                    </button>
                  </div>

                  {/* Flex layout to wrap books into new rows */}
                  <div className="flex flex-wrap gap-8">
                    {booksByYear[yearKey].map((book) => (
                      <div
                        key={book.id}
                        className="cursor-pointer flex flex-col items-center transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-gray-100 p-4 rounded-lg w-full sm:w-1/2 lg:w-1/3 xl:w-1/4"
                        onClick={() => handleBookClick(book.id, index + 1)}
                      >
                        <div className="w-32 h-48">
                          {thumbnails[book.id] ? (
                            <img
                              src={thumbnails[book.id]}
                              alt={`Thumbnail of ${book.filename}`}
                              className="w-full h-full object-cover rounded border-2 border-gray-400"
                            />
                          ) : (
                            <div className="flex justify-center items-center w-full h-full border-2 border-gray-400 rounded">
                              <div
                                className="spinner-border animate-spin inline-block w-12 h-12 border-4 border-t-transparent rounded-full text-gray-500"
                                role="status"
                              >
                                <span className="sr-only">Loading...</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-black-500 font-medium mt-2">
                          {book.filename}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal for Upload */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
              <div className="mb-4">
                <UploadFile
                  onUploadSuccess={fetchBooks}
                  year={uploadYear}
                  closeModal={closeModal}
                />
              </div>
              <div className="flex justify-between mt-4">
                <button
                  onClick={closeModal}
                  className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-blue-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Book;
