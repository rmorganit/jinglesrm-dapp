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

  useEffect(() => {
    if (error) {
      setTimeout(() => clearError(), 5000);
    }
  }, [error, clearError]);

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) {
      alert("Please enter recipient and amount");
      return;
    }
    try {
      await transferTokens(transferTo, transferAmount);
      setTransferTo("");
      setTransferAmount("");
      alert("✅ Transfer successful!");
    } catch (err) {
      alert("❌ Transfer failed: " + err.message);
    }
  };

  const handleBuy = async () => {
    if (!buyAmount) {
      alert("Please enter ETH amount");
      return;
    }
    try {
      await buyTokens(buyAmount);
      setBuyAmount("");
      // Force refresh balance after purchase
      await refreshBalance();
      alert("🛒 Tokens purchased successfully!");
    } catch (err) {
      alert("❌ Buy failed: " + err.message);
    }
  };

  const handleSetPrice = async () => {
    if (!newPrice) {
      alert("Please enter new price");
      return;
    }
    try {
      await setNewTokenPrice(newPrice);
      setNewPrice("");
      alert("💰 Price updated successfully!");
    } catch (err) {
      alert("❌ Price update failed: " + err.message);
    }
  };

  const handleWithdraw = async () => {
    if (window.confirm("Are you sure you want to withdraw ETH from the contract?")) {
      try {
        await withdrawETH();
        alert("💸 ETH withdrawn successfully!");
      } catch (err) {
        alert("❌ Withdrawal failed: " + err.message);
      }
    }
  };

  const handleImportToken = async () => {
    if (window.ethereum) {
      try {
        const success = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: '0x15c12f6854c88175d2cd1448ffcf668be61cf4aa',
              symbol: tokenSymbol,
              decimals: 18,
              image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x15c12f6854c88175d2cd1448ffcf668be61cf4aa/logo.png'
            },
          },
        });
        
        if (success) {
          alert('✅ Token imported successfully to your wallet!');
        } else {
          alert('❌ Token import cancelled or failed');
        }
      } catch (err) {
        console.error('Import token error:', err);
        alert('❌ Token import failed: ' + err.message);
      }
    } else {
      alert('Please install MetaMask or another Web3 wallet');
    }
  };

  const handleRefreshBalance = async () => {
    try {
      await refreshBalance();
      alert("✅ Balance refreshed!");
    } catch (err) {
      alert("❌ Refresh failed: " + err.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText('0x15c12f6854c88175d2cd1448ffcf668be61cf4aa');
    alert('Contract address copied to clipboard!');
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
            {/* Centered Account Status */}
            <div className="account-status-centered">
              <div className={`status-badge-large ${isOwner ? 'owner' : 'user'}`}>
                {isOwner ? '👑 Owner Account' : '👤 User Account'}
              </div>
            </div>

            {/* Main Content Card */}
            <div className="info-card">
              {/* Section Tabs */}
              <div className="section-tabs">
                <button 
                  className={`section-tab ${activeSection === 'buy' ? 'active' : ''}`}
                  onClick={() => setActiveSection('buy')}
                >
                  🛒 BUY JINGRM
                </button>
                <button 
                  className={`section-tab ${activeSection === 'about' ? 'active' : ''}`}
                  onClick={() => setActiveSection('about')}
                >
                  ℹ️ ABOUT JINGRM
                </button>
              </div>

              {/* Buy Section */}
              {activeSection === 'buy' && (
                <div className="section-content">
                  <h2>Buy JINGRM Tokens</h2>
                  
                  {/* Price and Rate Info at the Top */}
                  <div className="price-rate-section">
                    <div className="price-item">
                      <span className="price-label">💰 Price:</span>
                      <span className="price-value">{tokenPriceEth} ETH / JINGRM</span>
                    </div>
                    <div className="rate-item">
                      <span className="rate-label">📊 Rate:</span>
                      <span className="rate-value">1 ETH ≈ {Number(ratePerEth).toLocaleString()} JINGRM</span>
                    </div>
                  </div>

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
                    <div className="buy-input-group">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="ETH Amount (e.g., 0.01)"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="input-field"
                      />
                      <button className="action-button buy-button" onClick={handleBuy}>
                        🛒 Buy {tokenSymbol}
                      </button>
                    </div>
                  </div>

                  <div className="action-buttons-row">
                    <button className="action-button refresh-button compact" onClick={handleRefreshBalance}>
                      🔄 Refresh Balance
                    </button>
                    <button className="action-button import-button compact" onClick={handleImportToken}>
                      📥 Import to Wallet
                    </button>
                  </div>

                  {/* Token Import Info Section */}
                  <div className="import-info-section">
                    <h4>Token Information</h4>
                    <div className="import-info-grid">
                      <div className="import-info-item">
                        <span className="import-label">Contract:</span>
                        <span className="import-value" onClick={copyToClipboard}>
                          0x15c12...f4aa
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
                  <h2>About JINGRM</h2>
                  
                  <div className="about-content">
                    <div className="about-section">
                      <h3>What is JINGRM?</h3>
                      <p>JINGRM (Jing Real Money) is a utility token built on Ethereum Mainnet, designed to facilitate secure, transparent transactions across digital ecosystems.</p>
                    </div>

                    <div className="about-section">
                      <h3>Key Features</h3>
                      <ul className="features-list">
                        <li>🎯 <strong>Fixed Pricing:</strong> 1 ETH = 1,000 JINGRM</li>
                        <li>🔒 <strong>Ethereum Security:</strong> Built on Mainnet</li>
                        <li>💼 <strong>Real Utility:</strong> Powers services and transactions</li>
                        <li>🌍 <strong>Easy Access:</strong> No technical expertise required</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Always visible actions */}
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
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="input-field"
                  />
                  <button className="action-button transfer-button" onClick={handleTransfer}>
                    Transfer
                  </button>
                </div>
              </div>

              {isOwner && (
                <>
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
                      />
                      <button className="action-button price-button" onClick={handleSetPrice}>
                        Update Price
                      </button>
                    </div>
                    
                    <div className="contract-balance">
                      <span>Contract Balance: {contractBalance} ETH</span>
                      <button className="action-button withdraw-button" onClick={handleWithdraw}>
                        Withdraw ETH
                      </button>
                    </div>
                  </div>
                </>
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