import { useEffect, useState } from "react";
import api from "./api/axios";

export default function App() {
  const [status, setStatus] = useState("Checking API...");

  useEffect(() => {
    api
      .get("/health")
      .then((res) => setStatus(res.data.message))
      .catch((err) => setStatus("API not reachable: " + err.message));
  }, []);

  return <h1 style={{ padding: 24 }}>Expense Tracker: {status}</h1>;
}