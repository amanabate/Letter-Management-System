import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../../img icon/logo.png";
import { ArrowLeft } from "lucide-react";

const Forget: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/users/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      const error = err as any;
      setError(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo" className="h-16" />
        </div>
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] text-transparent bg-clip-text drop-shadow-md text-center mb-2">
          Forgot Password
        </h2>
        <p className="text-gray-500 text-center mb-6 text-sm">Enter your email address to receive a password reset link</p>
        <form onSubmit={handleSubmit}>
          <label className="block text-gray-400 text-xs mb-1 ml-2" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            className="w-full py-3 px-4 border border-gray-200 rounded-full mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#b97b2a] bg-gray-50"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="submit"
            className="w-full py-3 rounded-full text-lg font-semibold text-white bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] shadow-md hover:scale-105 transition-transform duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : null}
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        {message && <p className="text-green-600 mt-4 text-center text-sm">{message}</p>}
        {error && <p className="text-red-600 mt-4 text-center text-sm">{error}</p>}
        <button
          className="mt-4 px-6 py-2 rounded-full bg-[#f5e8d6] text-[#b97b2a] border border-[#b97b2a] text-sm font-semibold shadow-sm hover:bg-[#b97b2a] hover:text-white transition-colors duration-150 flex items-center justify-center gap-2"
          onClick={() => navigate("/login")}
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default Forget;
