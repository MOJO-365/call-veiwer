import "../styles/callViewer.css";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const apiUrl = "https://api.retellai.com/v2/list-calls";
const apiKey = "key_e474fc275a900aab9c7bcba6be4e";

export default function CallViewer() {
  const [toNumber, setToNumber] = useState("+61");
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [offset, setOffset] = useState(0);
  const [sortField, setSortField] = useState("start_timestamp");
  const [sortAsc, setSortAsc] = useState(false);
  const navigate = useNavigate();
  const limit = 10;

  const username = localStorage.getItem("username");
  const isAdmin = username === "admin";

  const validatePhoneNumber = (number) => /^\+61[1-9]\d{8}$/.test(number);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      console.log("offset", offset);
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      };

      // Admin users will see all calls, with optional filter on 'toNumber' after search

      const body = {
        sort_order: sortAsc ? "ascending" : "descending",
        sort_by: sortField,
        limit,
        offset,
        filter_criteria:
          isAdmin && toNumber === "+61" ? {} : { to_number: [toNumber] }, // Filter criteria is passed here
      };


      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log(data);
      setCalls(data || []);
    } catch (error) {
      console.error(error);
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("username");
      navigate("/login");
    }, 1000);
  };

  const handleSearch = () => {
    setOffset(0); // Reset pagination when a new search is performed
    fetchCalls();
  };

  useEffect(() => {
    // Fetch calls initially (admin users will see all calls by default)
    if (isAdmin) {
      fetchCalls();
    }
    // eslint-disable-next-line
  }, [offset, sortField, sortAsc]); // Re-fetch calls whenever offset, sort, or number changes

  const formatTimestamp = (timestamp) =>
    new Date(timestamp).toLocaleString("en-AU", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const renderPopup = () => {
    if (!popupData) return null;

    const {
      call_status,
      start_timestamp,
      duration_ms,
      call_analysis,
      recording_url,
    } = popupData;

    const customData = call_analysis?.custom_analysis_data || {};

    return (
      <div className="popup-table">
        <div className="popup-header">
          <h2>Call Details</h2>
          <span className="close-icon" onClick={() => setPopupData(null)}>
            ×
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Call Status</strong>
              </td>
              <td>{call_status}</td>
            </tr>
            <tr>
              <td>
                <strong>Start Time</strong>
              </td>
              <td>{formatTimestamp(start_timestamp)}</td>
            </tr>
            <tr>
              <td>
                <strong>Duration</strong>
              </td>
              <td>{Math.round(duration_ms / 1000)} seconds</td>
            </tr>
            <tr>
              <td>
                <strong>Sentiment</strong>
              </td>
              <td>{call_analysis?.user_sentiment || "Unknown"}</td>
            </tr>
            <tr>
              <td>
                <strong>Summary</strong>
              </td>
              <td>{call_analysis?.call_summary || "No summary available"}</td>
            </tr>
            {Object.entries(customData).map(([key, val]) => (
              <tr key={key}>
                <td>
                  <strong>{key.replace(/_/g, " ")}</strong>
                </td>
                <td>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {recording_url && <audio controls src={recording_url} />}
      </div>
    );
  };

  const getSentimentClass = (sentiment) => {
    if (sentiment === "Positive") return "sentiment-positive";
    if (sentiment === "Neutral") return "sentiment-negative";
    if (sentiment === "Unknown") return "sentiment-unknown";
    return "";
  };

  return (
    <div className="container">
      {(loading || isLoggingOut) && (
        <div className="overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className="header-bar">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="input-container">
        <input
          value={toNumber}
          onChange={(e) => setToNumber(e.target.value)}
          placeholder="Search by number (e.g. +61412345678)"
        />
        <button
          onClick={handleSearch}
          disabled={!validatePhoneNumber(toNumber)}
        >
          Search
        </button>
      </div>

      <div className="table-container">
        {calls.length === 0 && !loading && (
          <div className="error">❌ No calls found.</div>
        )}
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("to_number")}>To Number</th>
              <th onClick={() => toggleSort("call_status")}>Status</th>
              <th onClick={() => toggleSort("start_timestamp")}>Start</th>
              <th onClick={() => toggleSort("duration_ms")}>Duration</th>
              <th onClick={() => toggleSort("user_sentiment")}>Sentiment</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr
                key={call.call_id}
                onClick={() => setPopupData(call)}
                // className={getSentimentClass(
                //   call.call_analysis?.user_sentiment
                // )}
              >
                <td>{call.to_number}</td>
                <td>{call.call_status}</td>
                <td>{formatTimestamp(call.start_timestamp)}</td>
                <td>{Math.round(call.duration_ms / 1000)} sec</td>
                <td>
                  <div
                    className={getSentimentClass(
                      call.call_analysis?.user_sentiment
                    )}
                  >
                    {call.call_analysis?.user_sentiment || "Unknown"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* {isAdmin ? (
        <div className="table-container">
          {calls.length === 0 && !loading && (
            <div className="error">❌ No calls found.</div>
          )}
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("to_number")}>To Number</th>
                <th onClick={() => toggleSort("call_status")}>Status</th>
                <th onClick={() => toggleSort("start_timestamp")}>Start</th>
                <th onClick={() => toggleSort("duration_ms")}>Duration</th>
                <th onClick={() => toggleSort("user_sentiment")}>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr
                  key={call.call_id}
                  onClick={() => setPopupData(call)}
                  // className={getSentimentClass(
                  //   call.call_analysis?.user_sentiment
                  // )}
                >
                  <td>{call.to_number}</td>
                  <td>{call.call_status}</td>
                  <td>{formatTimestamp(call.start_timestamp)}</td>
                  <td>{Math.round(call.duration_ms / 1000)} sec</td>
                  <td>
                    <div
                      className={getSentimentClass(
                        call.call_analysis?.user_sentiment
                      )}
                    >
                      {call.call_analysis?.user_sentiment || "Unknown"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // <div className="cards-container">
        //   {calls.length === 0 && !loading && <div className="error">❌ No calls found.</div>}
        //   {calls.map(call => (
        //     <div
        //       key={call.call_id}
        //       className={`card ${getSentimentClass(call.call_analysis?.user_sentiment)}`}
        //       onClick={() => setPopupData(call)}
        //     >
        //       <div className="info">
        //         <span className="highlight">{call.to_number}</span><br /><br />
        //         <strong>Status:</strong> {call.call_status}<br />
        //         <strong>Time:</strong> {formatTimestamp(call.start_timestamp)}<br />
        //         <strong>Duration:</strong> {Math.round(call.duration_ms / 1000)} sec<br />
        //         <strong>Sentiment:</strong> {call.call_analysis?.user_sentiment || 'Unknown'}
        //       </div>
        //     </div>
        //   ))}
        // </div>
        <div className="table-container">
          {calls.length === 0 && !loading && (
            <div className="error">❌ No calls found.</div>
          )}
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("to_number")}>To Number</th>
                <th onClick={() => toggleSort("call_status")}>Status</th>
                <th onClick={() => toggleSort("start_timestamp")}>Start</th>
                <th onClick={() => toggleSort("duration_ms")}>Duration</th>
                <th onClick={() => toggleSort("user_sentiment")}>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr
                  key={call.call_id}
                  onClick={() => setPopupData(call)}
                  // className={getSentimentClass(
                  //   call.call_analysis?.user_sentiment
                  // )}
                >
                  <td>{call.to_number}</td>
                  <td>{call.call_status}</td>
                  <td>{formatTimestamp(call.start_timestamp)}</td>
                  <td>{Math.round(call.duration_ms / 1000)} sec</td>
                  <td>
                    <div
                      className={getSentimentClass(
                        call.call_analysis?.user_sentiment
                      )}
                    >
                      {call.call_analysis?.user_sentiment || "Unknown"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )} */}

      <div className="pagination">
        <button
          style={{ maxWidth: "20%" }}
          disabled={offset === 0 || loading}
          onClick={() => setOffset(Math.max(offset - limit, 0))}
        >
          Previous
        </button>
        <button
          style={{ maxWidth: "20%" }}
          disabled={calls.length < limit || loading}
          onClick={() => setOffset(offset + limit)}
        >
          Next
        </button>
      </div>

      {renderPopup()}
    </div>
  );
}
