import React, { useEffect, useState } from "react";
import { useWeb3 } from "./hooks/useWeb3";
import "./App.css";

function App() {
  const {
    account,
    tokenSymbol,
    jingBalance,
    totalSupply,
    tokenPriceEth,
    ratePerEth,
    isOwner,
    contractBalance,
    connectWallet,
    refreshBalance,
    transferTokens,
    buyTokens,
    setNewTokenPrice,
    withdrawETH,
    error,
    clearError
  } = useWeb3();

  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [activeSection, setActiveSection] = useState("buy");
  const [loading, setLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [currentAction, setCurrentAction] = useState("");
  const [hasMetaMask, setHasMetaMask] = useState(true);

  useEffect(() => {
    setHasMetaMask(!!window.ethereum);
  }, []);

  useEffect(() => {
    if (error) {
      setTimeout(() => clearError(), 5000);
    }
  }, [error, clearError]);

  const showStatus = (message, type = "success") => {
    setTransactionStatus({ message, type });
    setTimeout(() => setTransactionStatus(""), 4000);
  };

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) {
      showStatus("Please enter recipient address and amount", "error");
      return;
    }
    
    setLoading(true);
    setCurrentAction("transfer");
    try {
      await transferTokens(transferTo, transferAmount);
      setTransferTo("");
      setTransferAmount("");
      showStatus(`✅ Successfully sent ${transferAmount} ${tokenSymbol}`);
    } catch (err) {
      showStatus(`❌ Transfer failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  const handleBuy = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      showStatus("Please enter a valid ETH amount", "error");
      return;
    }
    
    setLoading(true);
    setCurrentAction("buy");
    try {
      const estimatedTokens = (buyAmount * ratePerEth).toLocaleString();
      await buyTokens(buyAmount);
      setBuyAmount("");
      showStatus(`✅ Success! Purchased ≈${estimatedTokens} ${tokenSymbol}`);
    } catch (err) {
      showStatus(`❌ Purchase failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  const handleSetPrice = async () => {
    if (!newPrice) {
      showStatus("Please enter a new token price", "error");
      return;
    }
    
    setLoading(true);
    setCurrentAction("setPrice");
    try {
      await setNewTokenPrice(newPrice);
      setNewPrice("");
      showStatus(`✅ Token price updated to ${newPrice} ETH`);
    } catch (err) {
      showStatus(`❌ Price update failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  const handleWithdraw = async () => {
    if (parseFloat(contractBalance) === 0) {
      showStatus("Contract has no ETH to withdraw", "error");
      return;
    }
    
    setLoading(true);
    setCurrentAction("withdraw");
    try {
      await withdrawETH();
      showStatus(`✅ Successfully withdrew ${contractBalance} ETH`);
    } catch (err) {
      showStatus(`❌ Withdrawal failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  const handleImportToken = async () => {
    setLoading(true);
    setCurrentAction("import");
    try {
      const success = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: '0x15c12f6854c88175d2cd1448ffcf668be61cf4aa',
            symbol: tokenSymbol,
            decimals: 18,
          },
        },
      });
      
      if (success) {
        showStatus('✅ Token added to your wallet!');
      } else {
        showStatus('Token import cancelled', "info");
      }
    } catch (err) {
      showStatus(`❌ Import failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  const handleRefreshBalance = async () => {
    setLoading(true);
    setCurrentAction("refresh");
    try {
      await refreshBalance();
      setBuyAmount(""); // Clear the buy amount field
      showStatus("✅ Balance updated!");
    } catch (err) {
      showStatus(`❌ Refresh failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('0x15c12f6854c88175d2cd1448ffcf668be61cf4aa');
    showStatus("📋 Contract address copied!");
  };

  const getButtonText = (action, defaultText) => {
    if (loading && currentAction === action) {
      switch (action) {
        case "buy": return "🛒 Buying...";
        case "transfer": return "⏳ Sending...";
        case "refresh": return "🔄 Refreshing...";
        case "import": return "📥 Importing...";
        case "setPrice": return "💰 Updating...";
        case "withdraw": return "💸 Withdrawing...";
        default: return "⏳ Processing...";
      }
    }
    return defaultText;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>JING Token Manager</h1>
        <p>Manage your {tokenSymbol} tokens on Ethereum Mainnet</p>
      </header>

      <div className="app-content">
        {!account ? (
          <div className="welcome-section">
            <div className="welcome-card">
              <h2>🚀 Welcome to JING Token Manager</h2>
              <p>Get started with JINGRM tokens in just a few steps</p>
              
              {!hasMetaMask ? (
                <div className="metamask-prompt">
                  <div className="metamask-header">
                    <div className="metamask-icon">🦊</div>
                    <h3>Get MetaMask</h3>
                  </div>
                  <p>You'll need MetaMask to interact with the blockchain</p>
                  <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="metamask-install-button">
                    🦊 Get MetaMask
                  </a>
                  <p className="metamask-note">Once installed, refresh this page</p>
                </div>
              ) : (
                <div className="connect-prompt">
                  <div className="connect-header">
                    <div className="connect-icon">🔗</div>
                    <h3>Connect Your Wallet</h3>
                  </div>
                  <p>Connect your MetaMask wallet to start managing JINGRM tokens</p>
                  <button className="connect-button" onClick={connectWallet}>
                    🔗 Connect to Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="dashboard">
            {/* Transaction Status Banner */}
            {transactionStatus && (
              <div className={`transaction-status ${transactionStatus.type}`}>
                {transactionStatus.message}
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>Processing transaction...</p>
              </div>
            )}

            <div className="account-status-centered">
              <div className={`status-badge-large ${isOwner ? 'owner' : 'user'}`}>
                {isOwner ? '👑 Owner Account' : '👤 User Account'}
              </div>
            </div>

            <div className="info-card">
              {/* Section Tabs */}
              <div className="section-tabs">
                <button 
                  className={`section-tab ${activeSection === 'buy' ? 'active' : ''}`}
                  onClick={() => setActiveSection('buy')}
                >
                  🛒 Buy Tokens
                </button>
                <button 
                  className={`section-tab ${activeSection === 'about' ? 'active' : ''}`}
                  onClick={() => setActiveSection('about')}
                >
                  ℹ️ About JINGRM
                </button>
              </div>

              {/* Buy Section */}
              {activeSection === 'buy' && (
                <div className="section-content">
                  <h2>Buy {tokenSymbol} Tokens</h2>
                  
                  {/* Price and Rate Info */}
                  <div className="price-rate-section">
                    <div className="price-item">
                      <span className="price-label">💰 Price:</span>
                      <span className="price-value">{tokenPriceEth} ETH / {tokenSymbol}</span>
                    </div>
                    <div className="rate-item">
                      <span className="rate-label">📊 Rate:</span>
                      <span className="rate-value">1 ETH = {Number(ratePerEth).toLocaleString()} {tokenSymbol}</span>
                    </div>
                  </div>

                  {/* Balance Info */}
                  <div className="compact-info-grid">
                    <div className="info-item highlight">
                      <div className="info-label">Your Balance</div>
                      <div className="info-value balance-highlight">
                        {Number(jingBalance).toLocaleString()} {tokenSymbol}
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Total Supply</div>
                      <div className="info-value">
                        {Number(totalSupply).toLocaleString()} {tokenSymbol}
                      </div>
                    </div>
                  </div>

                  {/* Buy Section */}
                  <div className="buy-section">
                    <h3>Buy {tokenSymbol}</h3>
                    <div className="buy-input-group">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="Enter ETH amount (e.g., 0.01)"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="input-field"
                        disabled={loading}
                      />
                      <button 
                        className="action-button buy-button" 
                        onClick={handleBuy}
                        disabled={loading}
                      >
                        {getButtonText("buy", `🛒 Buy ${tokenSymbol}`)}
                      </button>
                    </div>
                    {buyAmount && parseFloat(buyAmount) > 0 && (
                      <div className="estimated-amount">
                        You'll get ≈ {(buyAmount * ratePerEth).toLocaleString()} {tokenSymbol}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="quick-actions">
                    <h3>Quick Actions</h3>
                    <div className="action-buttons-row">
                      <button 
                        className="action-button import-button" 
                        onClick={handleImportToken}
                        disabled={loading}
                      >
                        {getButtonText("import", "🦊 Add to Wallet")}
                      </button>
                      <button 
                        className="action-button refresh-button" 
                        onClick={handleRefreshBalance}
                        disabled={loading}
                      >
                        {getButtonText("refresh", "🔄 Refresh")}
                      </button>
                    </div>
                    <p className="quick-actions-note">
                      "Add to Wallet" saves the token to your MetaMask. "Refresh" updates your balance.
                    </p>
                  </div>

                  {/* Token Info */}
                  <div className="import-info-section">
                    <h3>Token Information</h3>
                    <div className="import-info-grid">
                      <div className="import-info-item">
                        <span className="import-label">Contract:</span>
                        <span className="import-value copyable" onClick={copyToClipboard}>
                          0x15c12...f4aa 📋
                        </span>
                      </div>
                      <div className="import-info-item">
                        <span className="import-label">Symbol:</span>
                        <span className="import-value">{tokenSymbol}</span>
                      </div>
                      <div className="import-info-item">
                        <span className="import-label">Decimals:</span>
                        <span className="import-value">18</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* About Section */}
              {activeSection === 'about' && (
                <div className="section-content">
                  <div className="about-content">
                    <div className="about-section">
                      <h2>What is JINGRM?</h2>
                      <p className="intro-text">
                        JINGRM is a utility token built on the <strong>Ethereum blockchain</strong>, designed to power secure, transparent transactions across the JingNode ecosystem.
                      </p>
                      
                      <div className="value-props-grid">
                        <div className="value-prop-card">
                          <div className="value-prop-icon">🔗</div>
                          <h4>Blockchain Powered</h4>
                          <p>Built on Ethereum blockchain for security and transparency</p>
                        </div>
                        <div className="value-prop-card">
                          <div className="value-prop-icon">🎯</div>
                          <h4>Fixed Pricing</h4>
                          <p>1 ETH = 1,000 JINGRM - Predictable exchange rate</p>
                        </div>
                        <div className="value-prop-card">
                          <div className="value-prop-icon">💼</div>
                          <h4>Real Utility</h4>
                          <p>Power JingNode services and blockchain applications</p>
                        </div>
                      </div>
                    </div>

                    <div className="about-section">
                      <h3>Getting Started Guide</h3>
                      <div className="steps-grid">
                        <div className="step-card">
                          <div className="step-number">1</div>
                          <h4>Install MetaMask</h4>
                          <p>Get the browser wallet to interact with blockchain</p>
                        </div>
                        <div className="step-card">
                          <div className="step-number">2</div>
                          <h4>Connect Wallet</h4>
                          <p>Link your MetaMask to this dApp</p>
                        </div>
                        <div className="step-card">
                          <div className="step-number">3</div>
                          <h4>Buy & Import</h4>
                          <p>Purchase tokens and add to your wallet</p>
                        </div>
                      </div>
                    </div>

                    <div className="about-section">
                      <h3>Token Details</h3>
                      <div className="token-details-grid">
                        <div className="token-detail-item">
                          <span className="detail-label">Token Name:</span>
                          <span className="detail-value">JINGRM</span>
                        </div>
                        <div className="token-detail-item">
                          <span className="detail-label">Token Symbol:</span>
                          <span className="detail-value">{tokenSymbol}</span>
                        </div>
                        <div className="token-detail-item">
                          <span className="detail-label">Total Supply:</span>
                          <span className="detail-value">{Number(totalSupply).toLocaleString()} {tokenSymbol}</span>
                        </div>
                        <div className="token-detail-item">
                          <span className="detail-label">Current Price:</span>
                          <span className="detail-value">{tokenPriceEth} ETH</span>
                        </div>
                        <div className="token-detail-item">
                          <span className="detail-label">Exchange Rate:</span>
                          <span className="detail-value">1 ETH = {Number(ratePerEth).toLocaleString()} {tokenSymbol}</span>
                        </div>
                      </div>
                    </div>

                    <div className="about-section">
                      <h3>Features & Benefits</h3>
                      <div className="features-list">
                        <div className="feature-item">
                          <span className="feature-icon">⚡</span>
                          <span className="feature-text">Fast transactions on Ethereum network</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-icon">🔒</span>
                          <span className="feature-text">Secure and transparent blockchain technology</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-icon">🌐</span>
                          <span className="feature-text">Global accessibility and interoperability</span>
                        </div>
                        <div className="feature-item">
                          <span className="feature-icon">💎</span>
                          <span className="feature-text">Limited supply for value preservation</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transfer Section */}
            <div className="actions-section">
              <h3>Transfer Tokens</h3>
              <div className="transaction-section">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Recipient Address (0x...)"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="input-field"
                    disabled={loading}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="input-field"
                    disabled={loading}
                  />
                  <button 
                    className="action-button transfer-button" 
                    onClick={handleTransfer}
                    disabled={loading}
                  >
                    {getButtonText("transfer", "Send Tokens")}
                  </button>
                </div>
              </div>

              {isOwner && (
                <div className="transaction-section owner-section">
                  <h3>Owner Controls</h3>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="New price in ETH"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="input-field"
                      disabled={loading}
                    />
                    <button 
                      className="action-button price-button" 
                      onClick={handleSetPrice}
                      disabled={loading}
                    >
                      {getButtonText("setPrice", "Update Price")}
                    </button>
                  </div>
                  
                  <div className="contract-balance">
                    <span>Contract Balance: {contractBalance} ETH</span>
                    <button 
                      className="action-button withdraw-button" 
                      onClick={handleWithdraw}
                      disabled={loading || parseFloat(contractBalance) === 0}
                    >
                      {getButtonText("withdraw", "Withdraw ETH")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="error-section">
            <div className="error">
              ⚠️ {error}
            </div>
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>JING Token dApp • Built on Ethereum Mainnet</p>
      </footer>
    </div>
  );
}

export default App;