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

  useEffect(() => {
    if (error) {
      setTimeout(() => clearError(), 5000);
    }
  }, [error, clearError]);

  return (
    <div className="app">
      <h1>JING Token Manager</h1>
      <p>Manage your {tokenSymbol} tokens on Ethereum Mainnet</p>

      {!account ? (
        <button className="btn" onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p><strong>Account:</strong> {account}</p>
          <p><strong>Your Balance:</strong> {jingBalance} {tokenSymbol}</p>
          <p><strong>Total Supply:</strong> {totalSupply} {tokenSymbol}</p>
          <p><strong>Token Price:</strong> {tokenPriceEth} ETH</p>
          <p><strong>Rate:</strong> {ratePerEth} {tokenSymbol} per ETH</p>
          <button className="btn" onClick={refreshBalance}>Refresh Balance</button>
        </div>
      )}

      {account && (
        <div className="actions">
          <h2>Actions</h2>

          <div className="section">
            <h3>Transfer Tokens</h3>
            <input
              type="text"
              placeholder="Recipient Address"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
            <button
              className="btn"
              onClick={() => transferTokens(transferTo, transferAmount)}
            >
              Transfer
            </button>
          </div>

          <div className="section">
            <h3>Buy Tokens</h3>
            <input
              type="number"
              placeholder="ETH Amount"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
            />
            <button className="btn" onClick={() => buyTokens(buyAmount)}>
              Buy Tokens
            </button>
          </div>

          {isOwner && (
            <>
              <div className="section">
                <h3>Mint Tokens (Owner only)</h3>
                <input
                  type="number"
                  placeholder="Amount"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                />
                <button className="btn" onClick={() => mintTokens(mintAmount)}>
                  Mint
                </button>
              </div>

              <div className="section">
                <h3>Admin</h3>
                <button
                  className="btn"
                  onClick={() => setNewTokenPrice(prompt("New token price in ETH:"))}
                >
                  Set Token Price
                </button>
                <button className="btn" onClick={withdrawETH}>Withdraw ETH</button>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="error">⚠️ {error}</p>}
    </div>
  );
}

export default App;





// Wed Sep 24 10:34:14 EDT 2025
