import React, { useState } from 'react';
import { useWeb3 } from './hooks/useWeb3';
import './App.css';

function App() {
  const {
    account,
    jingBalance,
    tokenSymbol,
    totalSupply,
    connectWallet,
    error,
    switchToSepolia,
    isCorrectNetwork,
    refreshBalance,
    mintTokens,
    transferTokens,
    isOwner,
    contractAddress,
    transactionHistory,
    clearError
  } = useWeb3();
  
  const [mintAmount, setMintAmount] = useState('1000');
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState('');
  
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState('');

  const handleMint = async () => {
    if (!mintAmount || mintAmount <= 0) return;
    
    setIsMinting(true);
    setMintStatus('Minting...');
    clearError();
    
    try {
      const txHash = await mintTokens(mintAmount);
      setMintStatus(`Success! Transaction: ${txHash.substring(0, 10)}...`);
      setTimeout(() => setMintStatus(''), 5000);
    } catch (err) {
      setMintStatus(`Error: ${err.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || transferAmount <= 0 || !transferAddress) return;
    
    setIsTransferring(true);
    setTransferStatus('Processing transfer...');
    clearError();
    
    try {
      const txHash = await transferTokens(transferAddress, transferAmount);
      setTransferStatus(`Success! Transaction: ${txHash.substring(0, 10)}...`);
      setTransferAmount('');
      setTransferAddress('');
      setTimeout(() => setTransferStatus(''), 5000);
    } catch (err) {
      setTransferStatus(`Error: ${err.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const shortenContractAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatTransactionHash = (hash) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>JING Token Manager</h1>
        <p>Manage your JINGRM tokens on Sepolia Testnet</p>
      </header>

      <main className="app-main">
        {!account ? (
          <div className="connect-section">
            <div className="card">
              <h2>Connect Your Wallet</h2>
              <p>To get started, connect your MetaMask wallet</p>
              <button className="connect-button" onClick={connectWallet}>
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            {/* Network Status */}
            {!isCorrectNetwork && (
              <div className="network-alert">
                <p>Wrong network detected. Please switch to Sepolia Testnet.</p>
                <button onClick={switchToSepolia}>Switch to Sepolia</button>
              </div>
            )}

            {/* Connection Status */}
            <div className="status-card">
              <div className="status-badge connected">✅ Wallet Connected</div>
              <div className="account-info">
                <h3>Account</h3>
                <p>{shortenAddress(account)}</p>
              </div>
              <div className="network-info">
                <h3>Network</h3>
                <p>Sepolia Test Network {isCorrectNetwork && '✅'}</p>
              </div>
            </div>

            {/* Balance Card */}
            <div className="card">
              <h2>Your Balance</h2>
              <div className="balance-amount">
                {jingBalance} {tokenSymbol}
              </div>
              <button 
                className="refresh-button"
                onClick={refreshBalance}
                disabled={!isCorrectNetwork}
              >
                Refresh Balance
              </button>
            </div>

            {/* Transfer Section */}
            <div className="card transfer-section">
              <h2>Transfer Tokens</h2>
              <div className="transfer-controls">
                <div className="input-group">
                  <label>Recipient Address</label>
                  <input
                    type="text"
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    className="transfer-input"
                    placeholder="0x..."
                  />
                </div>
                <div className="input-group">
                  <label>Amount to Transfer</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="transfer-amount-input"
                    placeholder="Amount"
                    min="1"
                  />
                </div>
                <button 
                  className="transfer-button"
                  onClick={handleTransfer}
                  disabled={isTransferring || !isCorrectNetwork || !transferAmount || !transferAddress}
                >
                  {isTransferring ? (
                    <span className="button-loading">
                      <span className="spinner"></span>
                      Transferring...
                    </span>
                  ) : (
                    `Transfer ${tokenSymbol}`
                  )}
                </button>
              </div>
              {transferStatus && (
                <div className={`status-message ${transferStatus.includes('Error') ? 'error' : 'success'}`}>
                  {transferStatus}
                </div>
              )}
            </div>

            {/* Mint Section - Only for Owner */}
            {isOwner && (
              <div className="card mint-section">
                <h2>Mint Tokens (Owner Only)</h2>
                <div className="mint-controls">
                  <div className="input-group">
                    <label>Amount to Mint</label>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      className="mint-input"
                      placeholder="Amount"
                      min="1"
                    />
                  </div>
                  <button 
                    className="mint-button"
                    onClick={handleMint}
                    disabled={isMinting || !isCorrectNetwork}
                  >
                    {isMinting ? (
                      <span className="button-loading">
                        <span className="spinner"></span>
                        Minting...
                      </span>
                    ) : (
                      `Mint ${tokenSymbol}`
                    )}
                  </button>
                </div>
                {mintStatus && (
                  <div className={`status-message ${mintStatus.includes('Error') ? 'error' : 'success'}`}>
                    {mintStatus}
                  </div>
                )}
              </div>
            )}

            {/* Transaction History */}
            {transactionHistory.length > 0 && (
              <div className="card transaction-section">
                <h2>Recent Transactions</h2>
                <div className="transaction-list">
                  {transactionHistory.slice(0, 5).map((tx, index) => (
                    <div key={index} className="transaction-item">
                      <div className="transaction-type">{tx.type}</div>
                      <div className="transaction-hash">
                        {formatTransactionHash(tx.hash)}
                      </div>
                      <div className="transaction-amount">
                        {tx.amount} {tokenSymbol}
                      </div>
                      <div className="transaction-date">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Token Information */}
            <div className="card">
              <h2>Token Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Contract:</span>
                  <span className="info-value">{shortenContractAddress(contractAddress)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Supply:</span>
                  <span className="info-value">{totalSupply} {tokenSymbol}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value">
                    {isOwner ? 'Owner Account ✅' : 'User Account'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={clearError} className="dismiss-error">×</button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>JING Token dApp - Built on Ethereum Sepolia Testnet</p>
      </footer>
    </div>
  );
}

export default App;