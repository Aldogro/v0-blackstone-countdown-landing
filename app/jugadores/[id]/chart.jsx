'use client';

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
  } from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);
const Chart = ({ data }) => {
    const {
        serve,
        forehand,
        backhand,
        forehandVolley,
        backhandVolley,
        wallExit,
        bandeja,
        vibora,
        footwork,
        stamina,
        focus,
    } = data;
    const sortedData = [serve, forehand, backhand, forehandVolley, backhandVolley, wallExit, bandeja, vibora, footwork, stamina, focus];

  return (
    // full with if mobile hidden if desktop tailwind
    <div className={`w-full rounded-full p-5`}>
        <Radar
          data={{
            labels: [
                'Saque',
                'Drive',
                'Revés',
                'Volea Drive',
                'Volea Revés',
                'Salida de pared',
                'Bandeja',
                'Víbora',
                'Movilidad',
                'Resistencia',
                'Enfoque',
            ],
            datasets: [
                {
                  label: 'Calificación',
                  data: sortedData,
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1,
                },
              ],
          }}
          options={{
            scales: {
              r: {
                min: 0,
                max: 10,
                ticks: {
                    display: false,
                },
              },
            },
          }}
        />
    </div>
  );
};

export default Chart;
