import React, { useState } from "react";
import axios from "axios";

function UploadFile({ onUploadSuccess, year, closeModal }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        `http://localhost:8000/upload-book/?year=${year}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Upload successful:", response.data);
      setUploadSuccess(true);

      // Trigger the callback to refresh the book list
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      closeModal(); // Close modal after successful upload
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);
      setUploadSuccess(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Upload a PDF for Year {year}
      </h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-gray-600 font-medium mb-2">
            Choose a file
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="application/pdf"
            className="block w-full text-gray-800 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-blue-600 transition-colors duration-300"
        >
          Upload
        </button>
      </form>

      {uploadSuccess === true && (
        <p className="mt-4 text-green-600 font-medium">
          File uploaded successfully!
        </p>
      )}
      {uploadSuccess === false && (
        <p className="mt-4 text-red-600 font-medium">Failed to upload file.</p>
      )}
    </div>
  );
}

export default UploadFile;