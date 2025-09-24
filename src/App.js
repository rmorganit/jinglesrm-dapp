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
    connectWallet,
    refreshBalance,
    mintTokens,
    transferTokens,
    buyTokens,
    setNewTokenPrice,
    withdrawETH,
    error,
    clearError
  } = useWeb3();

  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [buyAmount, setBuyAmount] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    if (error) {
      setTimeout(() => clearError(), 5000);
    }
  }, [error, clearError]);

  const handleMint = async () => {
    if (!mintAmount) {
      alert("Please enter an amount to mint");
      return;
    }
    try {
      await mintTokens(mintAmount);
      setMintAmount("");
      alert("🎉 Tokens minted successfully!");
    } catch (err) {
      alert("❌ Mint failed: " + err.message);
    }
  };

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
            {/* Account Information Card */}
            <div className="info-card">
              <h2>👤 Account Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Account Address</div>
                  <div className="info-value account-address">
                    {account.substring(0, 6)}...{account.substring(account.length - 4)}
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Network Status</div>
                  <div className="info-value">
                    Ethereum Mainnet <span className="network-badge">✅ Connected</span>
                  </div>
                </div>
                
                <div className="info-item">
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
                
                <div className="info-item">
                  <div className="info-label">Token Price</div>
                  <div className="info-value">
                    {tokenPriceEth} ETH
                  </div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Exchange Rate</div>
                  <div className="info-value">
                    1 ETH = {Number(ratePerEth).toLocaleString()} {tokenSymbol}
                  </div>
                </div>
              </div>
              
              <div className="action-group">
                <button className="action-button secondary-button" onClick={refreshBalance}>
                  🔄 Refresh Balance
                </button>
              </div>
            </div>

            {/* Actions Section */}
            <div className="actions-section">
              <h2>⚡ Actions</h2>
              
              {/* Transfer Tokens */}
              <div className="transaction-section">
                <div className="section-header">
                  <span>🔄</span>
                  <h3>Transfer Tokens</h3>
                </div>
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
                  <button className="action-button" onClick={handleTransfer}>
                    Transfer {tokenSymbol}
                  </button>
                </div>
              </div>

              {/* Buy Tokens */}
              <div className="transaction-section">
                <div className="section-header">
                  <span>🛒</span>
                  <h3>Buy Tokens</h3>
                </div>
                <div className="rate-display">
                  <p>💰 <strong>Price:</strong> {tokenPriceEth} ETH / {tokenSymbol}</p>
                  <p>📊 <strong>Rate:</strong> 1 ETH ≈ {Number(ratePerEth).toLocaleString()} {tokenSymbol}</p>
                </div>
                <div className="input-group">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="ETH Amount (e.g., 0.01)"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="input-field"
                  />
                  <button className="action-button" onClick={handleBuy}>
                    Buy {tokenSymbol}
                  </button>
                </div>
              </div>

              {/* Owner Controls */}
              {isOwner && (
                <>
                  {/* Mint Tokens */}
                  <div className="transaction-section owner-section">
                    <div className="section-header">
                      <span>🏭</span>
                      <h3>Mint Tokens (Owner Only)</h3>
                    </div>
                    <div className="input-group">
                      <input
                        type="number"
                        placeholder="Amount to Mint"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                        className="input-field"
                      />
                      <button className="action-button" onClick={handleMint}>
                        Mint {tokenSymbol}
                      </button>
                    </div>
                  </div>

                  {/* Price Management */}
                  <div className="transaction-section owner-section">
                    <div className="section-header">
                      <span>💰</span>
                      <h3>Price Management</h3>
                    </div>
                    <div className="rate-display">
                      <p>📈 <strong>Current Price:</strong> {tokenPriceEth} ETH</p>
                      <p>🔢 <strong>Rate:</strong> 1 ETH ≈ {Number(ratePerEth).toLocaleString()} {tokenSymbol}</p>
                    </div>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="New price in ETH"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="input-field"
                      />
                      <button className="action-button" onClick={handleSetPrice}>
                        Update Price
                      </button>
                    </div>
                  </div>

                  {/* Withdraw ETH */}
                  <div className="transaction-section owner-section">
                    <div className="section-header">
                      <span>💸</span>
                      <h3>Contract Funds</h3>
                    </div>
                    <button className="action-button warning-button" onClick={handleWithdraw}>
                      Withdraw ETH from Contract
                    </button>
                  </div>
                </>
              )}

              {/* Token Information */}
              <div className="info-card">
                <div className="section-header">
                  <span>📊</span>
                  <h3>Token Information</h3>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Contract Address</div>
                    <div className="info-value">0x15c12...f4aa</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Total Supply</div>
                    <div className="info-value">{Number(totalSupply).toLocaleString()} {tokenSymbol}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status - Centered at Bottom */}
            <div className="status-section">
              <div className="status-card">
                <div className="section-header">
                  <span>👤</span>
                  <h3>Account Status</h3>
                </div>
                <div className="status-badge-container">
                  {isOwner ? (
                    <span className="owner-badge-large">👑 Owner Account</span>
                  ) : (
                    <span className="user-badge-large">👤 User Account</span>
                  )}
                </div>
              </div>
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
        <p>JING Token dApp • Built on Ethereum Mainnet • Secure & Decentralized</p>
      </footer>
    </div>
  );
}

export default App;
