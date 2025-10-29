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
      showStatus(`✅ Successfully transferred ${transferAmount} ${tokenSymbol} to ${transferTo.slice(0, 8)}...`);
    } catch (err) {
      showStatus(`❌ Transfer failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  const handleBuy = async () => {
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      showStatus("Please enter a valid ETH amount to buy tokens", "error");
      return;
    }
    
    setLoading(true);
    setCurrentAction("buy");
    try {
      const estimatedTokens = (buyAmount * ratePerEth).toLocaleString();
      await buyTokens(buyAmount);
      setBuyAmount("");
      showStatus(`✅ Success! Purchased ≈${estimatedTokens} ${tokenSymbol} for ${buyAmount} ETH`);
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
      showStatus(`✅ Token price updated to ${newPrice} ETH per ${tokenSymbol}`);
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
      showStatus(`✅ Successfully withdrew ${contractBalance} ETH from contract`);
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
        showStatus('✅ Token successfully added to your wallet!');
      } else {
        showStatus('Token import was cancelled', "info");
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
      showStatus("✅ Balance updated successfully!");
    } catch (err) {
      showStatus(`❌ Refresh failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
      setCurrentAction("");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('0x15c12f6854c88175d2cd1448ffcf668be61cf4aa');
    showStatus("📋 Contract address copied to clipboard!");
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
              <p>Connect your wallet to start managing your {tokenSymbol} tokens</p>
              <button className="connect-button" onClick={connectWallet}>
                🔗 Connect Wallet
              </button>
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

                  {/* Action Buttons - Import First */}
                  <div className="action-buttons-row">
                    <button 
                      className="action-button import-button compact" 
                      onClick={handleImportToken}
                      disabled={loading}
                    >
                      {getButtonText("import", "📥 Import to Wallet")}
                    </button>
                    <button 
                      className="action-button refresh-button compact" 
                      onClick={handleRefreshBalance}
                      disabled={loading}
                    >
                      {getButtonText("refresh", "🔄 Refresh Balance")}
                    </button>
                  </div>

                  {/* Buy Section */}
                  <div className="buy-section">
                    <div className="buy-input-group">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="ETH Amount (e.g., 0.01)"
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
                        ≈ {(buyAmount * ratePerEth).toLocaleString()} {tokenSymbol}
                      </div>
                    )}
                  </div>

                  {/* Token Info */}
                  <div className="import-info-section">
                    <h4>Token Information</h4>
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

              {/* Enhanced About Section */}
              {activeSection === 'about' && (
                <div className="section-content">
                  <div className="about-content">
                    <div className="about-section">
                      <h2>What is JINGRM?</h2>
                      <p className="intro-text">
                        JINGRM (Jing Real Money) is a utility token built on Ethereum Mainnet, designed to power secure, transparent transactions across the JingNode ecosystem. It's not just for investors — it's for anyone who wants to engage with digital assets confidently and practically.
                      </p>
                      
                      <div className="value-props-grid">
                        <div className="value-prop-card">
                          <div className="value-prop-icon">🎯</div>
                          <h4>Fixed Pricing</h4>
                          <p>1 ETH = 1,000 JINGRM - No volatility, predictable exchange rate</p>
                        </div>
                        <div className="value-prop-card">
                          <div className="value-prop-icon">🔗</div>
                          <h4>Ethereum Mainnet</h4>
                          <p>Built on Ethereum for security, liquidity, and global reach</p>
                        </div>
                        <div className="value-prop-card">
                          <div className="value-prop-icon">💼</div>
                          <h4>Real Utility</h4>
                          <p>Power JingNode services, cloud infrastructure, and smart contracts</p>
                        </div>
                        <div className="value-prop-card">
                          <div className="value-prop-icon">📈</div>
                          <h4>Capped Supply</h4>
                          <p>Limited supply supports long-term value and scarcity</p>
                        </div>
                      </div>
                    </div>

                    <div className="about-section">
                      <h3>How to Get Started</h3>
                      <div className="steps-grid">
                        <div className="step-card">
                          <div className="step-number">1</div>
                          <h4>Import to Wallet</h4>
                          <p>Click "Import to Wallet" to add JINGRM to your wallet for easy tracking and management</p>
                        </div>
                        <div className="step-card">
                          <div className="step-number">2</div>
                          <h4>Buy Tokens</h4>
                          <p>Enter ETH amount and click "Buy JINGRM" to purchase tokens at {tokenPriceEth} ETH each</p>
                        </div>
                        <div className="step-card">
                          <div className="step-number">3</div>
                          <h4>Use or Transfer</h4>
                          <p>Access JingNode services or transfer tokens to other addresses</p>
                        </div>
                      </div>
                    </div>

                    <div className="about-section">
                      <h3>Real-World Use Cases</h3>
                      <ul className="features-list">
                        <li>💰 <strong>Pay for JingNode Services</strong> - Cloud infrastructure, DevOps automation, and smart contract audits</li>
                        <li>⚡ <strong>Deploy Smart Contracts</strong> - Launch and manage secure blockchain applications</li>
                        <li>🔒 <strong>Access Secure Operations</strong> - Power backend systems with transparency</li>
                        <li>🌍 <strong>Global Transactions</strong> - Transact with confidence across the ecosystem</li>
                      </ul>
                    </div>

                    <div className="about-section">
                      <h3>Why Choose JINGRM?</h3>
                      <div className="benefits-grid">
                        <div className="benefit-item">
                          <strong>Utility-Based Token</strong>
                          <span>Real demand from service usage</span>
                        </div>
                        <div className="benefit-item">
                          <strong>Ethereum-Backed</strong>
                          <span>Security, liquidity, and wallet compatibility</span>
                        </div>
                        <div className="benefit-item">
                          <strong>Transparent Pricing</strong>
                          <span>Predictable exchange rate (1 ETH = 1,000 JINGRM)</span>
                        </div>
                        <div className="benefit-item">
                          <strong>Capped Supply</strong>
                          <span>Scarcity supports long-term value</span>
                        </div>
                        <div className="benefit-item">
                          <strong>Real-World Integration</strong>
                          <span>Used in cloud, DevOps, and smart contracts</span>
                        </div>
                        <div className="benefit-item">
                          <strong>Easy Access</strong>
                          <span>Anyone can buy and use — not just investors</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transfer Section */}
            <div className="actions-section">
              <h3>Token Transfer</h3>
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
                    {getButtonText("transfer", "Transfer")}
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