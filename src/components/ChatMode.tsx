import React, { useState } from "react";
import { Send, ChevronDown, Settings, HelpCircle, LogOut } from "lucide-react";
import { Line, Bar, Pie } from "react-chartjs-2";
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
  Legend,
} from "chart.js";
import DataTable from "./DataTable";
import { supabase } from "../lib/supabase";
import { chat, ChatMessage, parseAIResponse } from "../lib/ai";
import { ChatQueryService } from "../lib/chatQueryService";
import { QueryService, QueryResult } from "../lib/queryService";
import {
  DashboardService,
  ChartConfiguration,
  DashboardError,
} from "../lib/dashboardService";
import DashboardView from "./DashboardView";
import { useAccessLevels } from "../lib/hooks";
import { searchMockColumns, searchMockMetrics } from "../lib/mockdata";
import type { Profile } from "../lib/types";
import MetricsView from "./MetricsView";
import MentionDropdown from "./MentionDropdown";
import MetricDropdown from "./MetricDropdown";

// Register ChartJS components
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

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
        drawBorder: false,
      },
      ticks: {
        color: "#94a3b8",
        font: {
          size: 12,
        },
      },
    },
    y: {
      grid: {
        color: "rgba(255, 255, 255, 0.1)",
        drawBorder: false,
      },
      ticks: {
        color: "#94a3b8",
        font: {
          size: 12,
        },
      },
    },
  },
};

interface ChatModeProps {
  profile: Profile;
  view: "chat" | "dashboard" | "customers" | "revenue" | "metrics";
  dashboardTitle: string;
  isNewDashboard?: boolean;
  isNewMetric?: boolean;
  metricsTitle: string;
  showProfileMenu: boolean;
  setShowProfileMenu: (show: boolean) => void;
  onSettingsClick: () => void;
}

const ChatMode = ({
  profile,
  view,
  dashboardTitle,
  isNewDashboard,
  isNewMetric,
  metricsTitle,
  showProfileMenu,
  setShowProfileMenu,
  onSettingsClick,
}: ChatModeProps) => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const { accessLevels, loading: accessLevelsLoading } = useAccessLevels();
  const profileRef = React.useRef<HTMLDivElement>(null);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastQueryResult, setLastQueryResult] = useState<QueryResult | null>(
    null
  );
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [savingToDashboard, setSavingToDashboard] = React.useState(false);
  const [selectedChartType, setSelectedChartType] = React.useState<
    "line" | "bar" | "pie"
  >("line");
  const [chatQueryId, setChatQueryId] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [mentionSearch, setMentionSearch] = React.useState("");
  const [mentionPosition, setMentionPosition] = React.useState({
    top: 0,
    left: 0,
  });
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (profile && accessLevels.length > 0) {
      const userAccessLevel = accessLevels.find(
        (level) => level.id === profile.access_level_id
      );
      if (userAccessLevel) {
        setSelectedAccessLevel(userAccessLevel.name);
      }
    }
  }, [profile, accessLevels]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      const startTime = Date.now();
      setIsLoading(true);
      const userMessage: ChatMessage = { role: "user", content: message };
      setChatHistory((prev) => [...prev, userMessage]);
      setMessage("");
      let session = currentSession;

      try {
        // Create or get session
        if (!session) {
          session = await ChatQueryService.createSession(
            `Chat ${new Date().toLocaleString()}`
          );
          setCurrentSession(session);
        }

        // If the message asks about tables, show the data table
        if (
          message.toLowerCase().includes("table") ||
          message.toLowerCase().includes("show me")
        ) {
          const { data: tableData, error: tableError } = await supabase
            .from(
              message.toLowerCase().includes("orders") ? "orders" : "customers"
            )
            .select("*")
            .limit(100);

          if (!tableError && tableData) {
            const columns = Object.keys(tableData[0] || {}).map((key) => ({
              name:
                key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
              selector: (row: any) => row[key],
              sortable: true,
            }));

            setChatHistory((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `Here's the data from the ${
                  message.toLowerCase().includes("orders")
                    ? "orders"
                    : "customers"
                } table:`,
                table: {
                  columns,
                  data: tableData,
                },
              },
            ]);
            return;
          }
        }

        // Get AI response with SQL
        const response = await chat([...chatHistory, userMessage]);
        const { sql } = parseAIResponse(response.content);

        // Execute SQL if present
        if (sql) {
          try {
            const queryResult = await QueryService.executeQuery(sql, {
              prompt: message,
              source: "chat",
              name: `Chat Query ${new Date().toLocaleString()}`,
            });
            setExecutionTime(Date.now() - startTime);
            setLastQueryResult(queryResult);

            setChatHistory((prev) => [...prev, response]);
          } catch (queryError) {
            const errorResponse = `
${response.content}

I tried to run this SQL query:
\`\`\`sql
${sql}
\`\`\`

But there was an error: ${
              queryError instanceof Error ? queryError.message : "Unknown error"
            }
            `.trim();

            setChatHistory((prev) => [
              ...prev,
              {
                role: "assistant",
                content: errorResponse,
              },
            ]);
          }
        } else {
          // No SQL in response, just show the explanation
          setChatHistory((prev) => [
            ...prev,
            {
              role: "assistant",
              content: response.content,
            },
          ]);
        }
      } catch (error) {
        console.error("Chat error:", error);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I apologize, but I encountered an error while processing your request.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSaveChart = async () => {
    if (!lastQueryResult?.data || !lastQueryResult.sql) return;

    setSavingToDashboard(true);
    setSaveError(null);

    try {
      let dashboardId: string;

      if (view === "dashboard") {
        // Get dashboard ID from title
        const dashboards = await DashboardService.getDashboards();
        const dashboard = dashboards.find((d) => d.title === dashboardTitle);
        if (!dashboard) {
          throw new DashboardError("Dashboard not found");
        }
        dashboardId = dashboard.id;
      } else {
        // Create new dashboard
        const dashboard = await DashboardService.createDashboard({
          title: `Dashboard ${new Date().toLocaleTimeString()}`,
          user_id: profile.id,
          creation_method: "chat",
          is_public: false,
        });
        dashboardId = dashboard.id;
      }

      // Get next position
      const position = await DashboardService.getNextPosition(dashboardId);

      // Prepare chart configuration
      const data = lastQueryResult.data;
      const configuration: ChartConfiguration = {
        type: selectedChartType,
        labels: data.map((row) => Object.values(row)[0].toString()),
        datasets: [
          {
            data: data.map((row) => Number(Object.values(row)[1])),
            backgroundColor: [
              "#167147",
              "#4E7BE9",
              "#4EE997",
              "#E94E7B",
              "#7BE94E",
              "#E9974E",
            ],
            borderColor: "#167147",
          },
        ],
      };

      // Add component to dashboard
      const component = await DashboardService.addComponent({
        dashboard_id: dashboardId,
        type: "chart",
        configuration,
        query_text: lastQueryResult.sql,
        chat_prompt: message,
        position,
      });

      setShowSaveDialog(false);

      // Show success message
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Chart has been successfully saved to ${
            view === "dashboard" ? "the" : "a new"
          } dashboard! ${
            view !== "dashboard"
              ? '\n\nYou can find it in the sidebar under "Dashboards".'
              : ""
          }`,
        },
      ]);

      // If we created a new dashboard, switch to it
      if (view !== "dashboard") {
        onViewChange?.("dashboard", dashboard.title);
      }
    } catch (error) {
      console.error("Error saving chart:", error);
      setSaveError(
        error instanceof DashboardError
          ? error.message
          : "Failed to save chart to dashboard"
      );
    } finally {
      setSavingToDashboard(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const searchText = value.slice(lastAtIndex + 1);
      setMentionSearch(searchText);

      // Calculate dropdown position
      if (inputRef.current) {
        const inputRect = inputRef.current.getBoundingClientRect();
        const caretPosition = inputRef.current.selectionStart || 0;
        const textBeforeCaret = value.substring(0, caretPosition);
        const tempSpan = document.createElement("span");
        tempSpan.style.font = window.getComputedStyle(inputRef.current).font;
        tempSpan.textContent = textBeforeCaret;
        document.body.appendChild(tempSpan);
        const caretOffset = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);

        setMentionPosition({
          top: inputRect.bottom + window.scrollY + 5,
          left: inputRect.left + caretOffset,
        });
      }
    } else {
      setMentionSearch("");
    }
  };

  const handleMentionSelect = (column: { table: string; name: string }) => {
    const lastAtIndex = message.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const newMessage =
        message.slice(0, lastAtIndex) + `@${column.table}.${column.name} `;
      setMessage(newMessage);
      setMentionSearch("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="chat-container">
      {view === "chat" && (
        <>
          <header className="top-header">
            <div className="header-left">
              <button className="access-level">
                {selectedAccessLevel}
                <ChevronDown size={16} />
              </button>
            </div>
            <button
              className="user-info"
              ref={profileRef}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="user-details">
                <h3>{profile.email.split("@")[0]}</h3>
                <span>{profile.email}</span>
              </div>
              <div className="avatar">
                {profile.email.substring(0, 2).toUpperCase()}
              </div>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <button className="profile-item" onClick={onSettingsClick}>
                    <Settings size={16} />
                    Settings
                  </button>
                  <button className="profile-item">
                    <HelpCircle size={16} />
                    Help & Support
                  </button>
                  <button
                    className="profile-item text-red-500"
                    onClick={handleSignOut}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </button>
          </header>

          <div className="chat-content">
            <div className="messages">
              {chatHistory.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`message ${msg.role === "user" ? "user" : "ai"}`}
                >
                  <div className="message-content">
                    <p>{msg.content}</p>
                    {msg.visualization && (
                      <div className="visualization-container">
                        {msg.visualization.type === "metric" ? (
                          <div className="metric-display">
                            <div className="metric-value">
                              {msg.visualization.data.datasets[0].data[0].toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <div className="chart-container">
                            {msg.visualization.type === "line" && (
                              <Line
                                data={msg.visualization.data}
                                options={chartOptions}
                              />
                            )}
                            {msg.visualization.type === "bar" && (
                              <Bar
                                data={msg.visualization.data}
                                options={chartOptions}
                              />
                            )}
                            {msg.visualization.type === "pie" && (
                              <Pie
                                data={msg.visualization.data}
                                options={chartOptions}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {msg.role === "assistant" &&
                      executionTime &&
                      index === chatHistory.length - 1 && (
                        <div className="execution-time">
                          Executed in {(executionTime / 1000).toFixed(2)}s
                        </div>
                      )}
                    {msg.role === "assistant" &&
                      lastQueryResult &&
                      index === chatHistory.length - 1 && (
                        <div className="results-table">
                          <table>
                            <thead>
                              <tr>
                                {Object.keys(lastQueryResult.data[0] || {}).map(
                                  (column, index) => (
                                    <th key={index}>{column}</th>
                                  )
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {lastQueryResult.data.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {Object.keys(
                                    lastQueryResult.data[0] || {}
                                  ).map((column, colIndex) => (
                                    <td key={colIndex}>{row[column]}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    {msg.role === "assistant" &&
                      lastQueryResult &&
                      index === chatHistory.length - 1 && (
                        <div className="message-actions">
                          <button
                            className="save-chart-button"
                            onClick={() => setShowSaveDialog(true)}
                          >
                            Save to Dashboard
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-input-container">
            <form className="chat-input" onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <input
                  type="text"
                  ref={inputRef}
                  value={message}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  placeholder="Ask about your data..."
                />
                {mentionSearch && (
                  <MentionDropdown
                    columns={searchMockColumns(mentionSearch)}
                    onSelect={handleMentionSelect}
                    position={mentionPosition}
                  />
                )}
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </div>
        </>
      )}
      {view !== "chat" &&
        (view === "metrics" ? (
          <MetricsView
            profile={profile}
            title={metricsTitle}
            isNew={isNewMetric}
          />
        ) : (
          <DashboardView
            profile={profile}
            title={dashboardTitle}
            isNew={isNewDashboard}
          />
        ))}

      {showSaveDialog && (
        <div className="save-dialog-overlay">
          <div className="save-dialog">
            <h3>Save Chart to Dashboard</h3>
            <div className="chart-type-selector">
              <label>Chart Type:</label>
              <div className="chart-type-buttons">
                {saveError && <div className="error-message">{saveError}</div>}
                <button
                  className={selectedChartType === "line" ? "active" : ""}
                  onClick={() => setSelectedChartType("line")}
                >
                  Line
                </button>
                <button
                  className={selectedChartType === "bar" ? "active" : ""}
                  onClick={() => setSelectedChartType("bar")}
                >
                  Bar
                </button>
                <button
                  className={selectedChartType === "pie" ? "active" : ""}
                  onClick={() => setSelectedChartType("pie")}
                >
                  Pie
                </button>
              </div>
            </div>
            <div className="save-dialog-actions">
              <button
                className="cancel-button"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </button>
              <button
                className="save-button"
                onClick={handleSaveChart}
                disabled={savingToDashboard}
              >
                {savingToDashboard ? "Saving..." : "Save Chart"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .chat-container {
          width: 100%;
          height: 100%;
          min-height: 100%;
          background: var(--background-darker);
          display: flex;
          flex-direction: column;
          overflow: hidden;
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

        .access-level {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.375rem;
        }

        .access-level:hover {
          background: var(--hover-bg);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          background: transparent;
          border: none;
          gap: 1rem;
          flex-direction: row-reverse;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .user-info:hover {
          background: var(--hover-bg);
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
          transition: all 0.2s;
        }

        .user-info:hover .avatar {
          background: var(--secondary-color);
        }

        .profile-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
          min-width: 200px;
          z-index: 100;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .profile-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.875rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-item:hover {
          background: var(--hover-bg);
          color: white;
        }

        .profile-item.text-red-500 {
          color: #ef4444;
        }

        .profile-item.text-red-500:hover {
          background: rgba(239, 68, 68, 0.1);
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
        
        .chat-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }
        
        .messages {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }
        
        .message {
          display: flex;
          max-width: 80%;
        }
        
        .message.user {
          margin-left: auto;
        }
        
        .message-content {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          overflow: auto;
          background: var(--background-darker);
          color: white;
          width: 100%;
        }
        
        .message-content.table-message {
          padding: 0;
          background: transparent;
        }

        .message-text {
          padding: 0.75rem 1rem;
        }

        .table-container {
          margin-top: 1rem;
          border-radius: 0 0 0.5rem 0.5rem;
          overflow: hidden;
        }

        .message.ai .message-content {
          background: var(--primary-color);
        }
        
        .execution-time {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-light);
          font-style: italic;
        }
        
        .results-table {
          margin-top: 1rem;
          overflow-x: auto;
          background: var(--background-darker);
          border-radius: 0.375rem;
          border: 1px solid var(--border-color);
        }
        
        .results-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }
        
        .results-table th {
          background: var(--background-dark);
          color: var(--text-light);
          text-align: left;
          padding: 0.75rem;
          font-weight: 500;
          border-bottom: 1px solid var(--border-color);
        }
        
        .results-table td {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-color);
          color: white;
        }
        
        .results-table tr:hover td {
          background: var(--hover-bg);
        }

        .message-actions {
          margin-top: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .save-chart-button {
          background: var(--background-dark);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-chart-button:hover {
          background: var(--hover-bg);
        }

        .save-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .save-dialog {
          background: var(--background-darker);
          border-radius: 0.5rem;
          padding: 1.5rem;
          width: 100%;
          max-width: 400px;
        }

        .save-dialog h3 {
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
          font-weight: 500;
        }

        .chart-type-selector {
          margin-bottom: 1.5rem;
        }

        .chart-type-selector label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text-light);
          font-size: 0.875rem;
        }

        .chart-type-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .chart-type-buttons button {
          flex: 1;
          padding: 0.75rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          color: var(--text-light);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chart-type-buttons button:hover {
          background: var(--hover-bg);
          color: white;
        }

        .chart-type-buttons button.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }

        .save-dialog-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .cancel-button {
          flex: 1;
          padding: 0.75rem;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-light);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .cancel-button:hover {
          background: var(--hover-bg);
          color: white;
        }

        .save-button {
          flex: 1;
          padding: 0.75rem;
          background: var(--primary-color);
          border: none;
          color: white;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .save-button:hover {
          background: var(--secondary-color);
        }

        .save-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 0.375rem;
          width: 100%;
        }
        
        .chat-input-container {
          padding: 1rem 1.5rem;
          background: var(--background-darker);
          border-top: 1px solid var(--border-color);
        }
        
        .chat-input {
          display: flex;
          gap: 1rem;
          background: var(--background-dark);
          padding: 0.75rem;
          border-radius: 0.5rem;
          position: relative;
        }
        
        .input-wrapper {
          flex:  1;
          position: relative;
        }
        
        .chat-input input {
          width: 100%;
          background: transparent;
          border: none;
          color: white;
          font-size: 1rem;
          outline: none;
          padding: 0.5rem;
        }
        
        .chat-input input::placeholder {
          color: var(--text-light);
        }
        
        .chat-input button {
          background: var(--primary-color);
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .chat-input button:hover {
          background: var(--secondary-color);
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .chat-input button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .visualization-container {
          margin: 1rem 0;
        }
        
        .chart-container {
          height: 300px;
          margin: 1rem 0;
        }
        
        .metric-display {
          text-align: center;
          padding: 2rem;
        }
        
        .metric-value {
          font-size: 2.5rem;
          font-weight: 600;
          color: var(--primary-color);
        }
      `}</style>
    </div>
  );
};

export default ChatMode;
