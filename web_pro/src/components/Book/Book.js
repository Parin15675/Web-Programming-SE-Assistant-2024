import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadFile from './UploadFile';
import Nav from '../Nav';

function Book() {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    // Fetch list of books (IDs for now, later you can add metadata like title, etc.)
    axios.get('http://localhost:8000/api/books/')
      .then((res) => setBooks(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleBookClick = (bookId) => {
    setSelectedBook(bookId);
  };

  return (
    <div>
      <Nav/>
      <h1>Available Books</h1>
      <UploadFile/>
      <ul>
        {books.map((book) => (
          <li key={book.id} onClick={() => handleBookClick(book.id)}>
            {book.filename}
          </li>
        ))}
      </ul>

      {selectedBook && (
        <iframe
          src={`http://localhost:8000/books/${selectedBook}`}  // This is where your PDF will be displayed
          width="100%"   // Full width for better viewability
          height="800px"  // Set height for a vertical scrolling view
          style={{ border: "1px solid black" }}
          title="Book Viewer"
        ></iframe>
      )}
    </div>
  );
}

export default Book;
