import React from 'react';
import { Plus, LineChart, BarChart, PieChart, DollarSign, Users, ShoppingCart, ChevronDown, X, Send, Globe, MoreVertical } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import ShareDialog from './ShareDialog';
import { DashboardService } from '../lib/dashboardService';
import { useProfile } from '../lib/hooks';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardViewProps {
  title: string;
  profile: Profile;
  isNew?: boolean;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

type ChartType = 'line' | 'bar' | 'pie';

interface Currency {
  code: string;
  symbol: string;
  rate: number;
}

const currencies: Currency[] = [
  { code: 'USD', symbol: '$', rate: 1 },
  { code: 'EUR', symbol: '€', rate: 0.92 },
  { code: 'GBP', symbol: '£', rate: 0.79 },
  { code: 'JPY', symbol: '¥', rate: 151.42 },
];

interface ChartConfig {
  type: ChartType;
  data: any;
  options: any;
}

const salesData = {
  labels: months,
  datasets: [{
    data: [3000, 3200, 4500, 4200, 5800, 5500],
    borderColor: '#167147',
    tension: 0.4,
    pointRadius: 0,
    borderWidth: 2,
  }]
};

const revenueData = {
  labels: months,
  datasets: [{
    data: [9000, 9500, 14000, 13500, 16000, 15000],
    borderColor: '#167147',
    tension: 0.4,
    pointRadius: 0,
    borderWidth: 2,
  }]
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
        drawBorder: false,
      },
      ticks: {
        color: '#94a3b8',
        font: {
          size: 12
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
        drawBorder: false,
      },
      ticks: {
        color: '#94a3b8',
        font: {
          size: 12
        }
      }
    }
  }
};

const DashboardView = ({ title, profile, isNew = false }: DashboardViewProps) => {
  const [showNewChart, setShowNewChart] = React.useState(false);
  const [selectedCurrency, setSelectedCurrency] = React.useState<Currency>(currencies[0]);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = React.useState(false);
  const [salesChartType, setSalesChartType] = React.useState<ChartType>('line');
  const [revenueChartType, setRevenueChartType] = React.useState<ChartType>('line');
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [chartDescription, setChartDescription] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<Array<{ type: 'user' | 'ai'; message: string }>>([]);
  const [showAccessLevels, setShowAccessLevels] = React.useState(false);
  const [selectedAccessLevel, setSelectedAccessLevel] = React.useState('Admin');
  const [shareDialog, setShareDialog] = React.useState<{ isOpen: boolean; title: string }>({ isOpen: false, title: '' });
  
  React.useEffect(() => {
    if (isNew) {
      setShowNewChart(true);
    }
  }, [isNew]);

  const salesMenuRef = React.useRef<HTMLDivElement>(null);
  const revenueMenuRef = React.useRef<HTMLDivElement>(null);
  const customersMenuRef = React.useRef<HTMLDivElement>(null);
  const ordersMenuRef = React.useRef<HTMLDivElement>(null);
  const accessLevelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [salesMenuRef, revenueMenuRef, customersMenuRef, ordersMenuRef];
      if (!refs.some(ref => ref.current?.contains(event.target as Node)) && 
          !accessLevelRef.current?.contains(event.target as Node)) {
        setActiveMenu(null);
        setShowAccessLevels(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCurrency = (amount: number) => {
    const convertedAmount = amount * selectedCurrency.rate;
    return `${selectedCurrency.symbol}${convertedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getChartComponent = (type: ChartType, data: any, options: any) => {
    switch (type) {
      case 'bar':
        return <Bar data={data} options={options} />;
      case 'pie':
        return <Pie data={{
          labels: data.labels,
          datasets: [{
            data: data.datasets[0].data,
            backgroundColor: [
              '#167147',
              '#4E7BE9',
              '#4EE997',
              '#E94E7B',
              '#7BE94E',
              '#E9974E'
            ]
          }]
        }} options={{
          ...options,
          aspectRatio: 2
        }} />;
      default:
        return <Line data={data} options={options} />;
    }
  };

  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case 'bar':
        return <BarChart size={16} />;
      case 'pie':
        return <PieChart size={16} />;
      default:
        return <LineChart size={16} />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chartDescription.trim()) {
      setChatHistory([...chatHistory, { type: 'user', message: chartDescription }]);
      // Simulate AI response
      setTimeout(() => {
        setChatHistory(prev => [...prev, { 
          type: 'ai', 
          message: `I'll help you create a chart based on "${chartDescription}". What type of visualization would you prefer?` 
        }]);
      }, 1000);
      setChartDescription('');
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    try {
      await DashboardService.deleteDashboard(id);
      // Optionally trigger a refresh or navigation
    } catch (error) {
      console.error('Failed to delete dashboard:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="top-header">
        <div className="header-left">
          <div className="access-level-container" ref={accessLevelRef}>
            <button 
              className="access-level"
              onClick={() => setShowAccessLevels(!showAccessLevels)}
            >
              {selectedAccessLevel}
              <ChevronDown size={16} />
            </button>
            {showAccessLevels && (
              <div className="access-level-dropdown">
                {['Admin', 'Data Science', 'Sales', 'Operations', 'Product'].map((level) => (
                  <button
                    key={level}
                    className={`access-level-option ${level === selectedAccessLevel ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedAccessLevel(level);
                      setShowAccessLevels(false);
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="user-info">
          <div className="user-details">
            <h3>{profile.email.split('@')[0]}</h3>
            <span>{profile.email}</span>
          </div>
          <div className="avatar">{profile.email.substring(0, 2).toUpperCase()}</div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="content-header">
          <div>
            <h1>{title}</h1>
            <p className="subtitle">Real-time analytics and insights</p>
            <div className="currency-selector">
              <button 
                className="currency-button" 
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              >
                <Globe size={14} />
                <span>{selectedCurrency.code}</span>
                <ChevronDown size={14} />
              </button>
              {showCurrencyDropdown && (
                <div className="currency-dropdown">
                  {currencies.map((currency) => (
                    <button
                      key={currency.code}
                      className={`currency-option ${currency.code === selectedCurrency.code ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCurrency(currency);
                        setShowCurrencyDropdown(false);
                      }}
                    >
                      <span>{currency.symbol}</span>
                      <span>{currency.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button className="add-chart-button" onClick={() => setShowNewChart(true)}>
            <Plus size={16} />
            Add Chart
          </button>
        </div>

        <div className="metrics-grid">
          {(showNewChart || isNew) && (
            <div className="metric-card new-chart">
              <div className="new-chart-header">
                <h3>Create New Chart</h3>
                <button className="close-button" onClick={() => setShowNewChart(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="new-chart-content">
                <div className="messages">
                  {chatHistory.map((chat, index) => (
                    <div key={index} className={`message ${chat.type}`}>
                      <div className="message-content">{chat.message}</div>
                    </div>
                  ))}
                </div>
                <form className="chat-input" onSubmit={handleSubmit}>
                  <input
                      type="text"
                      value={chartDescription}
                      onChange={(e) => setChartDescription(e.target.value)}
                      placeholder="Describe the chart you want to create..."
                    />
                    <button type="submit">
                      <Send size={20} />
                    </button>
                </form>
              </div>
            </div>
          )}

          {!isNew && <div className="metric-card">
            <div className="metric-header">
              <h3>Total Sales</h3>
              <div className="metric-actions">
                <div className="menu-container" ref={salesMenuRef}>
                  <button 
                    className="menu-trigger"
                    onClick={() => setActiveMenu(activeMenu === 'sales' ? null : 'sales')}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {activeMenu === 'sales' && (
                    <div className="menu-dropdown">
                      <button 
                        className="menu-item"
                        onClick={() => {
                          setShareDialog({ isOpen: true, title: 'Total Sales' });
                          setActiveMenu(null);
                        }}
                      >
                        Manage Access
                      </button>
                      <button className="menu-item">
                        Duplicate
                      </button>
                      <button 
                        className="menu-item delete"
                        onClick={() => handleDeleteDashboard(id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="chart-type-buttons">
                  <button 
                    className={salesChartType === 'line' ? 'active' : ''} 
                    onClick={() => setSalesChartType('line')}
                  >
                    <LineChart size={16} />
                  </button>
                  <button 
                    className={salesChartType === 'bar' ? 'active' : ''} 
                    onClick={() => setSalesChartType('bar')}
                  >
                    <BarChart size={16} />
                  </button>
                  <button 
                    className={salesChartType === 'pie' ? 'active' : ''} 
                    onClick={() => setSalesChartType('pie')}
                  >
                    <PieChart size={16} />
                  </button>
                </div>
                <button><DollarSign size={16} className="icon-button" /></button>
              </div>
            </div>
            <div className="metric-value">{formatCurrency(24500)}</div>
            <div className="metric-trend positive">
              +12.5% from last month
            </div>
            <div className="metric-chart" style={{ height: '150px' }}>
              {getChartComponent(salesChartType, salesData, chartOptions)}
            </div>
          </div>}

          {!isNew && <div className="metric-card">
            <div className="metric-header">
              <h3>Revenue</h3>
              <div className="metric-actions">
                <div className="menu-container" ref={revenueMenuRef}>
                  <button 
                    className="menu-trigger"
                    onClick={() => setActiveMenu(activeMenu === 'revenue' ? null : 'revenue')}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {activeMenu === 'revenue' && (
                    <div className="menu-dropdown">
                      <button 
                        className="menu-item"
                        onClick={() => {
                          setShareDialog({ isOpen: true, title: 'Revenue' });
                          setActiveMenu(null);
                        }}
                      >
                        Manage Access
                      </button>
                      <button className="menu-item">
                        Duplicate
                      </button>
                      <button className="menu-item delete">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="chart-type-buttons">
                  <button 
                    className={revenueChartType === 'line' ? 'active' : ''} 
                    onClick={() => setRevenueChartType('line')}
                  >
                    <LineChart size={16} />
                  </button>
                  <button 
                    className={revenueChartType === 'bar' ? 'active' : ''} 
                    onClick={() => setRevenueChartType('bar')}
                  >
                    <BarChart size={16} />
                  </button>
                  <button 
                    className={revenueChartType === 'pie' ? 'active' : ''} 
                    onClick={() => setRevenueChartType('pie')}
                  >
                    <PieChart size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="metric-value">{formatCurrency(73500)}</div>
            <div className="metric-trend positive">
              +8.2% from last month
            </div>
            <div className="metric-chart" style={{ height: '150px' }}>
              {getChartComponent(revenueChartType, revenueData, chartOptions)}
            </div>
          </div>}

          {!isNew && <div className="metric-card">
            <div className="metric-header">
              <h3>Active Customers</h3>
              <div className="metric-actions">
                <div className="menu-container" ref={customersMenuRef}>
                  <button 
                    className="menu-trigger"
                    onClick={() => setActiveMenu(activeMenu === 'customers' ? null : 'customers')}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {activeMenu === 'customers' && (
                    <div className="menu-dropdown">
                      <button 
                        className="menu-item"
                        onClick={() => {
                          setShareDialog({ isOpen: true, title: 'Active Customers' });
                          setActiveMenu(null);
                        }}
                      >
                        Manage Access
                      </button>
                      <button className="menu-item">
                        Duplicate
                      </button>
                      <button className="menu-item delete">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <button><Users size={16} /></button>
              </div>
            </div>
            <div className="metric-value">1,234</div>
            <div className="metric-trend negative">
              -2.3% from last month
            </div>
          </div>}

          {!isNew && <div className="metric-card">
            <div className="metric-header">
              <h3>Orders</h3>
              <div className="metric-actions">
                <div className="menu-container" ref={ordersMenuRef}>
                  <button 
                    className="menu-trigger"
                    onClick={() => setActiveMenu(activeMenu === 'orders' ? null : 'orders')}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {activeMenu === 'orders' && (
                    <div className="menu-dropdown">
                      <button 
                        className="menu-item"
                        onClick={() => {
                          setShareDialog({ isOpen: true, title: 'Orders' });
                          setActiveMenu(null);
                        }}
                      >
                        Manage Access
                      </button>
                      <button className="menu-item">
                        Duplicate
                      </button>
                      <button className="menu-item delete">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <button><ShoppingCart size={16} /></button>
              </div>
            </div>
            <div className="metric-value">856</div>
            <div className="metric-trend positive">
              +5.7% from last month
            </div>
          </div>}
        </div>
      </div>
      
      <ShareDialog 
        isOpen={shareDialog.isOpen}
        onClose={() => setShareDialog({ isOpen: false, title: '' })}
        title={shareDialog.title}
      />

      <style>{`
        .dashboard-container {
          height: 100vh;
          background: var(--background-darker);
          color: white;
          display: flex;
          flex-direction: column;
        }

        .top-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: var(--background-darker);
          border-bottom: 1px solid var(--border-color);
        }

        .header-left {
          display: flex;
          align-items: center;
        }

        .access-level-container {
          position: relative;
          z-index: 100;
        }
        
        .access-level {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
          min-width: 120px;
          justify-content: space-between;
        }

        .access-level:hover {
          background: var(--hover-bg);
          color: white;
        }
        
        .access-level-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 0.5rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          overflow: hidden;
          z-index: 100;
          min-width: 160px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .access-level-option {
          width: 100%;
          text-align: left;
          padding: 0.75rem 1.25rem;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          display: block;
        }
        
        .access-level-option:hover {
          background: var(--hover-bg);
          color: white;
        }
        
        .access-level-option.active {
          background: var(--primary-color);
          color: white;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-direction: row-reverse;
        }
        
        .avatar {
          width: 40px;
          height: 40px;
          background: var(--primary-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .user-details h3 {
          color: white;
          margin: 0;
          font-size: 1rem;
          text-align: right;
        }
        
        .user-details span {
          color: var(--text-light);
          font-size: 0.875rem;
          text-align: right;
          display: block;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .content-header h1 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: var(--text-light);
          font-size: 0.875rem;
        }

        .currency-selector {
          position: relative;
          margin-top: 0.75rem;
        }

        .currency-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .currency-button:hover {
          background: var(--hover-bg);
          color: white;
        }

        .currency-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          margin-top: 0.5rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          overflow: hidden;
          z-index: 10;
          min-width: 120px;
        }

        .currency-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .currency-option:hover {
          background: var(--hover-bg);
          color: white;
        }

        .currency-option.active {
          background: var(--primary-color);
          color: white;
        }

        .add-chart-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: var(--primary-color);
          border: none;
          border-radius: 0.375rem;
          color: white;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .dashboard-content {
          padding: 2rem 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .metric-card {
          background: var(--background-dark);
          border-radius: 0.5rem;
          padding: 1.5rem;
          position: relative;
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .metric-header h3 {
          font-size: 1rem;
          color: var(--text-light);
          font-weight: 500;
        }

        .metric-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-button {
          color: var(--text-light);
        }

        .metric-actions button {
          background: transparent;
          border: none;
          color: var(--text-light);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
        }

        .metric-actions button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .chart-type-buttons {
          display: flex;
          gap: 0.25rem;
          padding: 0.25rem;
          background: var(--background-darker);
          border-radius: 0.375rem;
        }

        .chart-type-buttons button {
          background: transparent;
          border: none;
          color: var(--text-light);
          padding: 0.375rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chart-type-buttons button:hover {
          background: var(--hover-bg);
          color: white;
        }

        .chart-type-buttons button.active {
          background: var(--primary-color);
          color: white;
        }

        .menu-container {
          position: relative;
        }

        .menu-trigger {
          background: transparent;
          border: none;
          color: var(--text-light);
          padding: 0.25rem;
          border-radius: 0.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-trigger:hover {
          background: var(--hover-bg);
          color: white;
        }

        .menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.25rem;
          background: var(--background-darker);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          overflow: hidden;
          min-width: 160px;
          z-index: 50;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .menu-item {
          width: 100%;
          text-align: left;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .menu-item:hover {
          background: var(--hover-bg);
          color: white;
        }

        .menu-item.delete {
          color: #ef4444;
        }

        .menu-item.delete:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: white;
        }

        .metric-trend {
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }

        .metric-trend.positive {
          color: #4ade80;
        }

        .metric-trend.negative {
          color: #f87171;
        }

        .new-chart {
          background: var(--background-dark);
          border-radius: 0.5rem;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 400px;
        }

        .new-chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .new-chart-header h3 {
          font-size: 1rem;
          color: white;
          font-weight: 500;
        }

        .close-button {
          background: transparent;
          border: none;
          color: var(--text-light);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: var(--hover-bg);
          color: white;
        }

        .new-chart-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          position: relative;
        }

        .messages {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }

        .message {
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
        }

        .message.user {
          align-items: flex-end;
        }

        .message.ai {
          align-items: flex-start;
        }

        .message-content {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          max-width: 80%;
          font-size: 0.875rem;
        }

        .message.user .message-content {
          background: var(--primary-color);
          color: white;
          border-top-right-radius: 0;
        }

        .message.ai .message-content {
          background: var(--background-darker);
          color: white;
          border-top-left-radius: 0;
        }

        .chat-input {
          padding: 1rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 0.5rem;
        }

        .chat-input input {
          flex: 1;
          padding: 0.75rem 1rem;
          background: var(--background-darker);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          color: white;
          font-size: 0.875rem;
        }

        .chat-input input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .chat-input button {
          padding: 0.75rem;
          background: var(--primary-color);
          border: none;
          border-radius: 0.375rem;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-input button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default DashboardView;