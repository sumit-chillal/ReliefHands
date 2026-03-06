import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const GOOGLE_CLIENT_ID = "14073114499-ns931u4r24t97p37l2qhlhtdui1h6odk.apps.googleusercontent.com";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accountType, setAccountType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
      setAccountType(response.data.accountType);
    } catch (error) {
      console.error("Failed to load user", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user || response.data.ngo);
    setAccountType(response.data.accountType);
    return response.data;
  };

  const registerVolunteer = async (name, email, password) => {
    const response = await axios.post(`${API}/auth/register-volunteer`, {
      name,
      email,
      password,
    });
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
    setAccountType("user");
    return response.data;
  };

  const registerNGO = async (ngoData) => {
    const response = await axios.post(`${API}/auth/register-ngo`, ngoData);
    localStorage.setItem("token", response.data.token);
    setUser(response.data.ngo);
    setAccountType("ngo");
    return response.data;
  };

  const googleAuth = async (token) => {
    const response = await axios.post(`${API}/auth/google`, { token });
    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
    setAccountType(response.data.accountType);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setAccountType(null);
  };

  const getToken = () => localStorage.getItem("token");

  return (
    <AuthContext.Provider
      value={{
        user,
        accountType,
        loading,
        login,
        registerVolunteer,
        registerNGO,
        googleAuth,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
