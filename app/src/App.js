import './App.css';
import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ethers } from "ethers";
import Create from './components/Create.jsx';
import Home from './components/Home.jsx';
import Closed from './components/Closed.jsx';
import contractData from './contracts/contractData.json';
import Nav from './components/Nav.jsx';

function App() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [marketplace, setMarketplace] = useState(null);
  const [connected, setConnected] = useState(false);
  const [firstTime, setFirstTime] = useState(false);

  // Function to check MetaMask and request accounts
  const checkMetaMask = async () => {
    try {
      if (!window.ethereum) {
        toast.error("MetaMask is not installed!");
        return;
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const acc = await signer.getAddress();
      
      setAccount(acc);
      setConnected(true);
      setFirstTime(true);
      console.log("Connected account:", acc);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      toast.error("Failed to connect to MetaMask");
    }
  };

  const checkAccount = async () => {
    if (!account) {
      console.log("Checking account inside checkAccount");
      await checkMetaMask();
    }
  };

  useEffect(() => {
    if (account !== null) {
      initiateContract();
    }
  }, [account]);

  const initiateContract = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contract = new ethers.Contract(contractData.address, contractData.abi, signer);
      setMarketplace(contract);
      setLoading(false);
    } catch (error) {
      console.error("Error initializing contract:", error);
      toast.error("Failed to load contract");
    }
  };

  return (
    <BrowserRouter>
      <ToastContainer />
      <div className="App font-jersey-25">
        <div className="gradient-bg-welcome">
          <Nav account={account} checkMetaMask={checkMetaMask} loading={loading} />
          {loading && !firstTime ? (
            <div>Loading...</div>
          ) : (
            <Routes>
              <Route
                path='/create'
                element={<Create contractAddress={contractData.address} contractABI={contractData.abi} />}
              />
              <Route
                path='/'
                element={<Home contractAddress={contractData.address} contractABI={contractData.abi} />}
              />
              <Route
                path='/closed'
                element={<Closed contractAddress={contractData.address} contractABI={contractData.abi} />}
              />
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
