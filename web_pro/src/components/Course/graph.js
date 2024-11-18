import React from "react";
import { Line } from "react-chartjs-2";

const Graph = ({ curriculum, ratings, calculatePredictedGrade, starRatingToNumericGrade }) => {
  if (!curriculum || !curriculum.subjects) return null;

  const data = {
    labels: curriculum.subjects.map((subject) => subject.name), // Subject names as labels
    datasets: [
      {
        label: "Your Grades",
        data: curriculum.subjects.map((subject) => {
          const userRating = ratings[subject.name];
          return userRating !== null && userRating !== -1
            ? starRatingToNumericGrade(userRating)
            : null; // Use the user's rating, if available
        }),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        tension: 0.4, // Smooth curve for the line
        fill: true,
      },
      {
        label: "Predicted Grades",
        data: curriculum.subjects.map((subject) => {
          const userRating = ratings[subject.name];
          return userRating === null || userRating === -1
            ? calculatePredictedGrade()
            : null; // Predicted grades only for unrated subjects
        }),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderDash: [5, 5], // Dashed line for predicted grades
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top", // Position of the legend
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 4,
        ticks: {
          stepSize: 0.5, // Step size for clarity
        },
        title: {
          display: true,
          text: "Grades",
        },
      },
      x: {
        title: {
          display: true,
          text: "Subjects",
        },
      },
    },
  };

  return (
    <div style={{ height: "400px" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default Graph;
