import React, { useState } from 'react';
import axios from 'axios';

function UploadFile() {
  // Define state for selected file and upload success flag
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null); // null means no upload attempt yet

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]); // Store the selected file in state
  };

  // Handle file upload
  const handleUpload = (event) => {
    event.preventDefault();
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    // Make POST request to upload the file (note: fixed URL to match backend)
    axios.post("http://localhost:8000/upload-book/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((res) => {
        setUploadSuccess(true); // Set success flag
      })
      .catch((err) => {
        console.error(err);
        setUploadSuccess(false); // Set failure flag
      });
  };

  return (
    <div>
      <h2>Upload PDF</h2>
      <form onSubmit={handleUpload}>
        <input type="file" onChange={handleFileChange} accept="application/pdf" />
        <button type="submit">Upload</button>
      </form>

      {/* Display upload status */}
      {uploadSuccess === true && <p>File uploaded successfully!</p>}
      {uploadSuccess === false && <p>Failed to upload file.</p>}
    </div>
  );
}

export default UploadFile;
