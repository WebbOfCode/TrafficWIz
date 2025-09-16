import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function TrendsChart({ series }) {
  const data = {
    labels: series.map(d => d.month),
    datasets: [{ label: "Accidents", data: series.map(d => d.count) }],
  };
  const options = { responsive: true, maintainAspectRatio: false };
  return <div style={{height:300}}><Line data={data} options={options} /></div>;
}
