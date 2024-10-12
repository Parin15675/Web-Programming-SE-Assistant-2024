import React from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

const Graph = ({ curriculum, career, ratings, careerRequirement, calculatePredictedGrade, starRatingToNumericGrade }) => {
  const generateCombinedChartData = () => {
    if (!curriculum || !careerRequirement) return null;

    const labels = curriculum.subjects.map((subject) => subject.name);
    const userGradesData = labels.map(
      (subjectName) => starRatingToNumericGrade(ratings[subjectName]) || 0
    );
    const predictedGrade = calculatePredictedGrade();
    const predictedGradesData = labels.map(
      (subjectName) =>
        starRatingToNumericGrade(ratings[subjectName]) ||
        (predictedGrade ? Math.min(predictedGrade, 4) : 0)
    );

    return {
      labels,
      datasets: [
        {
          label: "User Grades",
          fill: false,
          lineTension: 0.1,
          backgroundColor: "rgba(75,192,192,0.4)",
          borderColor: "rgba(75,192,192,1)",
          data: userGradesData,
        },
        {
          label: `${career} Predicted Grade`,
          fill: false,
          lineTension: 0.1,
          backgroundColor: "rgba(153,102,255,0.4)",
          borderColor: "rgba(153,102,255,1)",
          data: predictedGradesData,
        },
      ],
    };
  };

  const chartData = generateCombinedChartData();

  return (
    <div>
      {chartData && (
        <Line
          data={chartData}
          options={{
            maintainAspectRatio: false, // Allow the chart to fill the container
            responsive: true, // Make the chart responsive
            scales: {
              y: {
                beginAtZero: true,
                max: 4,
              },
            },
          }}
        />
      )}
    </div>
  );
};

export default Graph;
