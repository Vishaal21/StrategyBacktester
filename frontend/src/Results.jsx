import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

function Results() {
  const resultsData = JSON.parse(localStorage.getItem('backtestResults'))

  if (!resultsData) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>No Results Found</h1>
        <p>Please run a backtest first.</p>
        <button onClick={() => window.close()} style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '20px' }}>
          Close
        </button>
      </div>
    )
  }

  const dailyPnl = resultsData.results.daily_pnl
  const dates = dailyPnl.map(d => d.date)
  const pnlValues = dailyPnl.map(d => d.cumulative_pnl)

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Cumulative P&L',
        data: pnlValues,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2,
        tension: 0.1
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Backtest Results - P&L Over Time',
        font: {
          size: 18
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'P&L ($)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  }

  const finalPnl = resultsData.results.final_pnl
  const isProfitable = finalPnl >= 0

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Backtest Results</h1>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
        <h2>Strategy Summary</h2>
        <div style={{ marginBottom: '10px' }}>
          <strong>Option Type:</strong> {resultsData.strategy_summary.option_type.toUpperCase()}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Strike:</strong> ${resultsData.strategy_summary.strike}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Position:</strong> {resultsData.strategy_summary.position_direction.toUpperCase()}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Entry Price:</strong> ${resultsData.strategy_summary.entry_price}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Entry Date:</strong> {resultsData.strategy_summary.entry_date}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Expiry:</strong> {resultsData.strategy_summary.expiry}
        </div>
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
        <h2>Performance Metrics</h2>
        <div style={{ marginBottom: '10px' }}>
          <strong>Final P&L:</strong>
          <span style={{ color: isProfitable ? '#16a34a' : '#dc2626', fontWeight: 'bold', marginLeft: '10px' }}>
            ${finalPnl.toFixed(2)}
          </span>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Win Rate:</strong> {resultsData.results.win_rate}%
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Max Drawdown:</strong> ${resultsData.results.max_drawdown}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Position Closed:</strong> {resultsData.results.position_closed ? 'Yes' : 'No'}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Exit Reason:</strong> {resultsData.results.exit_reason}
        </div>
      </div>

      <div style={{ marginBottom: '30px', height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>

      <button
        onClick={() => window.close()}
        style={{
          padding: '10px 20px',
          cursor: 'pointer',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px'
        }}
      >
        Close
      </button>
    </div>
  )
}

export default Results
