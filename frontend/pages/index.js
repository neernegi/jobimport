import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

export default function Home() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

  useEffect(() => {
    fetchLogs();
  }, [page]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("import:started", (data) => {
      console.log("Import started:", data);
      fetchLogs();
    });

    socket.on("import:progress", (data) => {
      console.log("Progress:", data);
    });

    socket.on("import:finished", (data) => {
      console.log("Import finished:", data);
      fetchLogs();
    });

    return () => socket.disconnect();
  }, []);

  async function fetchLogs() {
    try {
      const res = await axios.get(
        `${API_URL}/api/import-logs?page=${page}&limit=20`
      );
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  }

  return (
    <div className="px-6 py-10 bg-gray-100 min-h-screen">
     
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        📊 Import History Dashboard
      </h1>

  
      <div className="bg-white shadow-lg rounded-xl p-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-700 text-sm">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Feed URL</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Imported</th>
              <th className="py-3 px-4">New</th>
              <th className="py-3 px-4">Updated</th>
              <th className="py-3 px-4">Failed</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log, index) => (
              <tr
                key={log._id}
                className={`border-b hover:bg-gray-50 transition ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="py-3 px-4 text-gray-800">
                  {new Date(log.timestamp).toLocaleString()}
                </td>

                <td className="py-3 px-4 text-gray-700 max-w-xs truncate">
                  {log.feedUrl}
                </td>

                <td className="py-3 px-4 text-blue-600 font-semibold">
                  {log.totalFetched}
                </td>

                <td className="py-3 px-4 text-green-600 font-semibold">
                  {log.totalImported}
                </td>

                <td className="py-3 px-4 text-gray-800">{log.newJobs}</td>

                <td className="py-3 px-4 text-gray-800">{log.updatedJobs}</td>

                <td className="py-3 px-4 text-red-600 font-semibold">
                  {log.failedJobs ? log.failedJobs.length : 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

     
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-4 py-2 rounded-md text-white ${
              page === 1
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Prev
          </button>

          <span className="text-gray-700 font-medium text-lg">
            Page {page}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
