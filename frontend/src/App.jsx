import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const HEALTH_CHECK_INTERVAL = 50000 // 50 seconds in milliseconds

function App() {
  const [datasets, setDatasets] = useState([])
  const [validationResult, setValidationResult] = useState(null)
  const [backtestResult, setBacktestResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [backendStatus, setBackendStatus] = useState('checking') // 'healthy', 'unhealthy', 'checking'

  // Metadata state
  const [validationMetadata, setValidationMetadata] = useState(null)
  const [backtestMetadata, setBacktestMetadata] = useState(null)

  // Form state for validation
  const [validationForm, setValidationForm] = useState({
    dataset_name: '',
    option_type: 'call',
    strike: '',
    expiry: '',
    position_direction: 'buy',
    quantity: 1
  })

  // Form state for backtest
  const [backtestForm, setBacktestForm] = useState({
    dataset_name: '',
    option_type: 'call',
    strike: '',
    expiry: '',
    position_direction: 'buy',
    quantity: 1,
    start_date: '',
    end_date: ''
  })

  // Health check function to keep backend alive
  const checkBackendHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 10000 })
      console.log('✅ Backend health check:', response.data)
      setBackendStatus('healthy')
    } catch (err) {
      console.error('❌ Backend health check failed:', err.message)
      setBackendStatus('unhealthy')
    }
  }

  // Health check interval - runs every 50 seconds to keep Render backend alive
  useEffect(() => {
    // Check immediately on mount
    checkBackendHealth()

    // Set up interval for periodic checks
    const intervalId = setInterval(() => {
      checkBackendHealth()
    }, HEALTH_CHECK_INTERVAL)

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId)
      console.log('🛑 Health check interval cleared')
    }
  }, [])

  // Fetch datasets on component mount
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/datasets/list`)
        setDatasets(response.data.datasets || [])
        // Set first dataset as default if available
        if (response.data.datasets && response.data.datasets.length > 0) {
          const firstDataset = response.data.datasets[0].name
          setValidationForm(prev => ({ ...prev, dataset_name: firstDataset }))
          setBacktestForm(prev => ({ ...prev, dataset_name: firstDataset }))
        }
      } catch (err) {
        setError(err.message)
      }
    }
    fetchDatasets()
  }, [])

  // Fetch metadata when validation dataset changes
  useEffect(() => {
    if (validationForm.dataset_name) {
      fetchValidationMetadata(validationForm.dataset_name)
    }
  }, [validationForm.dataset_name])

  // Fetch metadata when backtest dataset changes
  useEffect(() => {
    if (backtestForm.dataset_name) {
      fetchBacktestMetadata(backtestForm.dataset_name)
    }
  }, [backtestForm.dataset_name])

  // Update strikes when expiry changes for validation
  useEffect(() => {
    if (validationMetadata && validationForm.expiry) {
      const strikes = validationMetadata.available_strikes[validationForm.expiry]
      if (strikes && strikes.length > 0 && !validationForm.strike) {
        setValidationForm(prev => ({ ...prev, strike: strikes[0] }))
      }
    }
  }, [validationForm.expiry, validationMetadata])

  // Update strikes when expiry changes for backtest
  useEffect(() => {
    if (backtestMetadata && backtestForm.expiry) {
      const strikes = backtestMetadata.available_strikes[backtestForm.expiry]
      if (strikes && strikes.length > 0 && !backtestForm.strike) {
        setBacktestForm(prev => ({ ...prev, strike: strikes[0] }))
      }
    }
  }, [backtestForm.expiry, backtestMetadata])

  const fetchValidationMetadata = async (datasetName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/datasets/${datasetName}/metadata`)
      setValidationMetadata(response.data)
      // Set default values
      if (response.data.available_expiries && response.data.available_expiries.length > 0) {
        const firstExpiry = response.data.available_expiries[0]
        const strikes = response.data.available_strikes[firstExpiry]
        setValidationForm(prev => ({
          ...prev,
          expiry: firstExpiry,
          strike: strikes && strikes.length > 0 ? strikes[0] : ''
        }))
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchBacktestMetadata = async (datasetName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/datasets/${datasetName}/metadata`)
      setBacktestMetadata(response.data)
      // Set default values
      if (response.data.available_expiries && response.data.available_expiries.length > 0) {
        const firstExpiry = response.data.available_expiries[0]
        const strikes = response.data.available_strikes[firstExpiry]
        setBacktestForm(prev => ({
          ...prev,
          expiry: firstExpiry,
          strike: strikes && strikes.length > 0 ? strikes[0] : '',
          start_date: response.data.date_range.start,
          end_date: response.data.date_range.end
        }))
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const validateStrategy = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/strategy/validate`, validationForm)
      setValidationResult(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
    setLoading(false)
  }

  const runBacktest = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        strategy: {
          dataset_name: backtestForm.dataset_name,
          option_type: backtestForm.option_type,
          strike: Number(backtestForm.strike),
          expiry: backtestForm.expiry,
          position_direction: backtestForm.position_direction,
          quantity: Number(backtestForm.quantity)
        },
        date_range: {
          start_date: backtestForm.start_date,
          end_date: backtestForm.end_date
        }
      }
      const response = await axios.post(`${API_BASE_URL}/api/backtest/run`, payload)
      setBacktestResult(response.data)
      // Save to localStorage for results page
      localStorage.setItem('backtestResults', JSON.stringify(response.data))
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
    }
    setLoading(false)
  }

  const openResults = () => {
    window.open('/results', '_blank')
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Options Strategy Backtester</h1>

      {/* Backend Status Indicator */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 16px',
        marginBottom: '20px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        backgroundColor: backendStatus === 'healthy' ? '#f0fdf4' : backendStatus === 'unhealthy' ? '#fef2f2' : '#f3f4f6',
        border: `1px solid ${backendStatus === 'healthy' ? '#22c55e' : backendStatus === 'unhealthy' ? '#ef4444' : '#d1d5db'}`,
        color: backendStatus === 'healthy' ? '#16a34a' : backendStatus === 'unhealthy' ? '#dc2626' : '#6b7280'
      }}>
        <span style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          marginRight: '8px',
          backgroundColor: backendStatus === 'healthy' ? '#22c55e' : backendStatus === 'unhealthy' ? '#ef4444' : '#9ca3af'
        }}></span>
        {backendStatus === 'healthy' ? 'Backend Connected' : backendStatus === 'unhealthy' ? 'Backend Disconnected' : 'Checking Backend...'}
      </div>

      {error && <div style={{ color: 'red', padding: '10px', backgroundColor: '#ffe6e6', marginBottom: '20px' }}>{error}</div>}
      {loading && <div style={{ color: 'blue', marginBottom: '20px' }}>Loading...</div>}

      {/* Validate Strategy Section */}
      <section style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd' }}>
        <h2>Validate Strategy</h2>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Strategy Type:</label>
          <select
            value="single_leg"
            disabled
            style={{ padding: '5px', width: '200px', backgroundColor: '#f5f5f5' }}
          >
            <option value="single_leg">Single Leg</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Dataset Name:</label>
          <select
            value={validationForm.dataset_name}
            onChange={(e) => setValidationForm({...validationForm, dataset_name: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
          >
            {datasets.map(dataset => (
              <option key={dataset.name} value={dataset.name}>{dataset.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Option Type:</label>
          <select
            value={validationForm.option_type}
            onChange={(e) => setValidationForm({...validationForm, option_type: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
          >
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Expiry:</label>
          <select
            value={validationForm.expiry}
            onChange={(e) => setValidationForm({...validationForm, expiry: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
            disabled={!validationMetadata}
          >
            {validationMetadata?.available_expiries?.map(expiry => (
              <option key={expiry} value={expiry}>{expiry}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Strike:</label>
          <select
            value={validationForm.strike}
            onChange={(e) => setValidationForm({...validationForm, strike: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
            disabled={!validationForm.expiry}
          >
            {validationMetadata?.available_strikes[validationForm.expiry]?.map(strike => (
              <option key={strike} value={strike}>{strike}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Position Direction:</label>
          <select
            value={validationForm.position_direction}
            onChange={(e) => setValidationForm({...validationForm, position_direction: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Contract Quantity:</label>
          <input
            type="number"
            value={validationForm.quantity}
            onChange={(e) => setValidationForm({...validationForm, quantity: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
          />
        </div>
        <button onClick={validateStrategy} style={{ padding: '10px 20px', cursor: 'pointer', marginLeft: '150px' }}>
          Validate Strategy
        </button>
        {validationResult && (
          <div style={{
            backgroundColor: validationResult.valid ? '#f0fdf4' : '#fef2f2',
            padding: '20px',
            marginTop: '20px',
            border: `1px solid ${validationResult.valid ? '#22c55e' : '#ef4444'}`,
            borderRadius: '4px'
          }}>
            <h3 style={{ marginTop: 0, color: validationResult.valid ? '#16a34a' : '#dc2626' }}>
              {validationResult.valid ? '✓ Strategy is Valid' : '✗ Strategy is Invalid'}
            </h3>
            <p style={{ fontSize: '16px', marginBottom: '10px' }}>
              {validationResult.message}
            </p>
            {validationResult.entry_price && (
              <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                Entry Price: ${validationResult.entry_price}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Run Backtest Section */}
      <section style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd' }}>
        <h2>Run Backtest</h2>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Strategy Type:</label>
          <select
            value="single_leg"
            disabled
            style={{ padding: '5px', width: '200px', backgroundColor: '#f5f5f5' }}
          >
            <option value="single_leg">Single Leg</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Dataset Name:</label>
          <select
            value={backtestForm.dataset_name}
            onChange={(e) => setBacktestForm({...backtestForm, dataset_name: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
          >
            {datasets.map(dataset => (
              <option key={dataset.name} value={dataset.name}>{dataset.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Option Type:</label>
          <select
            value={backtestForm.option_type}
            onChange={(e) => setBacktestForm({...backtestForm, option_type: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
          >
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Expiry:</label>
          <select
            value={backtestForm.expiry}
            onChange={(e) => setBacktestForm({...backtestForm, expiry: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
            disabled={!backtestMetadata}
          >
            {backtestMetadata?.available_expiries?.map(expiry => (
              <option key={expiry} value={expiry}>{expiry}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Strike:</label>
          <select
            value={backtestForm.strike}
            onChange={(e) => setBacktestForm({...backtestForm, strike: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
            disabled={!backtestForm.expiry}
          >
            {backtestMetadata?.available_strikes[backtestForm.expiry]?.map(strike => (
              <option key={strike} value={strike}>{strike}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Position Direction:</label>
          <select
            value={backtestForm.position_direction}
            onChange={(e) => setBacktestForm({...backtestForm, position_direction: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Contract Quantity:</label>
          <input
            type="number"
            value={backtestForm.quantity}
            onChange={(e) => setBacktestForm({...backtestForm, quantity: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
          />
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>Start Date:</label>
          <input
            type="date"
            value={backtestForm.start_date}
            onChange={(e) => setBacktestForm({...backtestForm, start_date: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
            min={backtestMetadata?.date_range?.start}
            max={backtestMetadata?.date_range?.end}
            disabled={!backtestMetadata}
          />
        </div>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <label style={{ width: '150px' }}>End Date:</label>
          <input
            type="date"
            value={backtestForm.end_date}
            onChange={(e) => setBacktestForm({...backtestForm, end_date: e.target.value})}
            style={{ padding: '5px', width: '200px' }}
            min={backtestMetadata?.date_range?.start}
            max={backtestMetadata?.date_range?.end}
            disabled={!backtestMetadata}
          />
        </div>
        <button onClick={runBacktest} style={{ padding: '10px 20px', cursor: 'pointer', marginLeft: '150px' }}>
          Run Backtest
        </button>
        {backtestResult && (
          <div style={{
            backgroundColor: '#f0fdf4',
            padding: '20px',
            marginTop: '20px',
            border: '1px solid #22c55e',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginTop: 0, color: '#16a34a' }}>
              ✓ Backtest Complete!
            </h3>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>
              Your backtest results are ready to view.
            </p>
            <button
              onClick={openResults}
              style={{
                padding: '12px 24px',
                cursor: 'pointer',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              View Results & Graph
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
