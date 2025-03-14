import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Alert, Spinner, Form, ProgressBar } from 'react-bootstrap';
import { toast } from 'react-toastify';
import './Home.css';

function Home({ contractAddress, contractABI }) {
  const [openCampaigns, setOpenCampaigns] = useState([]);
  const [donationAmounts, setDonationAmounts] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /// fetching campaigns
  const getCampaigns = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const tron = window.tronLink;
      const tronWeb = tron.tronWeb;
  
      if (!tron || !tronWeb) {
        throw new Error("TronLink not found. Please make sure TronLink is installed and connected.");
      }
  
      const contract = await tronWeb.contract(contractABI, contractAddress);
      const allCampaigns = await contract.getCampaigns().call();
      const currentTime = Math.floor(Date.now() / 1000);
  
      const tolerance = 0.0001;
  
      const campaignsWithIds = allCampaigns.map((campaign, index) => ({
        ...campaign,
        id: index,
        amountCollected: parseFloat(tronWeb.fromSun(campaign.amountCollected)),
        target: parseFloat(tronWeb.fromSun(campaign.target)),
        deadline: parseInt(campaign.deadline, 10)
      }));
  
      const open = campaignsWithIds.filter(campaign => {
        const { amountCollected, target, deadline } = campaign;
        return amountCollected + tolerance < target && deadline > currentTime;
      });
  
      setOpenCampaigns(open);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      setError("Failed to load campaigns. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    getCampaigns();
  }, []);

  const handleDonationChange = (campaignId, value) => {
    setDonationAmounts(prev => ({
      ...prev,
      [campaignId]: value
    }));
  };
  // donation f
  const donateToCampaign = async (campaignId) => {
    const donationAmount = donationAmounts[campaignId];
    const parsedAmount = parseFloat(donationAmount);
  
    if (!parsedAmount || parsedAmount <= 0 || isNaN(parsedAmount)) {
      toast.error('Please enter a valid donation amount.', { position: 'top-center' });
      return;
    }
  
    try {
      const tron = window.tronLink;
      if (!tron?.tronWeb) {
        throw new Error('TronLink not found. Please make sure TronLink is installed and connected.');
      }
  
      const tronWeb = tron.tronWeb;
      const contract = await tronWeb.contract(contractABI, contractAddress);
  
      const amountInSun = tronWeb.toSun(parsedAmount);
  
      // Notify the user that donation is in progress
      toast.info('Donation processing, please wait...', { position: 'top-center' });
  
      // Disable the button for the specific campaign
      setDonationAmounts((prev) => ({
        ...prev,
        [campaignId]: 'Donating...', // Temporarily set button text to "Donating..."
      }));
  
      const tx = await contract.donateToCampaign(campaignId).send({
        callValue: amountInSun,
        shouldPollResponse: true,
      });
      // taking more time while donatinng
      console.log('Transaction:', tx);
      toast.success('Donation successful!', { position: 'top-center' });
  
      // Refresh the page after a successful donation
      setTimeout(() => {
        window.location.reload();
      }, 1500);
  
    } catch (error) {
      console.error('Error donating to campaign:', error);
      toast.error(`Donation failed. ${error.message || 'Please try again.'}`, { position: 'top-center' });
    } finally {
      // Reset the button text
      setDonationAmounts((prev) => ({
        ...prev,
        [campaignId]: '',
      }));
    }
  };
  
  const calculateProgress = (collected, target) => {
    return (collected / target) * 100;
  };

  const getPinataUrl = (hash) => {
    return hash
      ? `https://gateway.pinata.cloud/ipfs/${hash}`
      : 'https://via.placeholder.com/200x200?text=No+Image';
  };

  const renderCampaigns = (campaigns, isClosed) => (
    <Row xs={1} md={2} lg={3} className="g-4">
      {campaigns.map((campaign) => {
        const tronWeb = window.tronLink.tronWeb;
        const collected = tronWeb.fromSun(campaign.amountCollected);
        const target = tronWeb.fromSun(campaign.target);
        const progress = calculateProgress(collected, target);

        return (
          <Col key={campaign.id} className="d-flex align-items-stretch">
            <div className="card custom-card">
              <img
                className="card-img-top"
                src={getPinataUrl(campaign.image)}
                alt={campaign.title}
                style={{ height: '200px', objectFit: 'cover', width: '100%' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/200x200?text=Error+Loading+Image';
                }}
              />
              <div className="card-body">
                <h5 className="card-title">{campaign.title}</h5>
                <p className="card-text">{campaign.description}</p>
                <p><strong>Target:</strong> {target} TRX</p>
                <p><strong>Collected:</strong> {collected} TRX</p>
                <p><strong>Deadline:</strong> {new Date(campaign.deadline * 1000).toLocaleString()}</p>

                <ProgressBar
                  now={isClosed ? 100 : progress}
                  label={isClosed ? 'Campaign Closed' : `${Math.round(progress)}%`}
                  variant={isClosed ? 'danger' : 'success'}
                />

                {!isClosed && (
                  <>
                    <Form.Control
                      type="number"
                      placeholder="Enter donation amount"
                      value={donationAmounts[campaign.id] || ''}
                      onChange={(e) => handleDonationChange(campaign.id, e.target.value)}
                      className="mb-3 mt-3"
                      min="0"
                      step="0.1"
                    />
 <Button
  onClick={() => donateToCampaign(campaign.id)}
  variant="primary"
  className="w-100"
  disabled={!donationAmounts[campaign.id] || donationAmounts[campaign.id] === 'Donating...'}
>
  {donationAmounts[campaign.id] === 'Donating...' ? 'Donating...' : 'Donate'}
</Button>

                  </>
                )}
              </div>
            </div>
          </Col>
        );
      })}
    </Row>
  );

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <h2 className="text-center mb-4">Open Campaigns</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            {loading ? (
              <div className="text-center mt-5">
                <Spinner animation="border" />
                <p>Loading campaigns...</p>
              </div>
            ) : (
              renderCampaigns(openCampaigns, false)
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;