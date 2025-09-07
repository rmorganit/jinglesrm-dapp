import React from 'react';
import { useWeb3 } from './hooks/useWeb3';
import './App.css';

function App() {
  const { 
    account, 
    jingBalance, 
    tokenSymbol, 
    tokenName,
    totalSupply,
    connectWallet, 
    error, 
    switchToSepolia, 
    isCorrectNetwork, 
    isLoading,
    refreshBalance,
    mintTokens,
    isOwner,
    contractAddress
  } = useWeb3();

  const [mintAmount, setMintAmount] = React.useState('1000');
  const [mintStatus, setMintStatus] = React.useState('');

  // Debug useEffect
  React.useEffect(() => {
    console.log('Current state:', {
      account,
      jingBalance,
      isCorrectNetwork,
      contractAddress,
      isOwner,
      tokenSymbol,
      tokenName
    });
  }, [account, jingBalance, isCorrectNetwork, contractAddress, isOwner, tokenSymbol, tokenName]);

  const handleMint = async () => {
    try {
      setMintStatus('Minting...');
      const txHash = await mintTokens(parseInt(mintAmount));
      setMintStatus(`Minted successfully! TX: ${txHash.substring(0, 10)}...`);
      setTimeout(() => setMintStatus(''), 5000);
    } catch (error) {
      setMintStatus(`Mint failed: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>JING Token dApp</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '0.5rem' }}>{tokenName} dApp</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Manage your {tokenSymbol} tokens on Sepolia Testnet
      </p>
      
      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '8px',
          margin: '1rem 0',
          color: '#c33'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {!account ? (
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <button 
            onClick={connectWallet}
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '2rem', 
          borderRadius: '12px',
          margin: '2rem 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#27ae60', marginBottom: '1.5rem', textAlign: 'center' }}>✅ Wallet Connected</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px' }}>
              <h3 style={{ color: '#666', fontSize: '14px', margin: '0 0 0.5rem 0' }}>Account</h3>
              <p style={{ margin: '0', fontWeight: 'bold', fontSize: '16px' }}>
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </p>
            </div>
            
            <div style={{ padding: '1rem', background: 'white', borderRadius: '8px' }}>
              <h3 style={{ color: '#666', fontSize: '14px', margin: '0 0 0.5rem 0' }}>Network</h3>
              <p style={{ margin: '0', fontWeight: 'bold', fontSize: '16px', color: isCorrectNetwork ? '#27ae60' : '#e74c3c' }}>
                {isCorrectNetwork ? 'Sepolia Test Network ✅' : 'Wrong Network ⚠️'}
              </p>
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#666', fontSize: '16px', margin: '0 0 1rem 0' }}>Your Balance</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#333' }}>
              {jingBalance} {tokenSymbol}
            </p>
            <button 
              onClick={refreshBalance}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '1rem',
                fontSize: '14px'
              }}
            >
              Refresh Balance
            </button>
          </div>

          {isCorrectNetwork && isOwner && (
            <div style={{ padding: '1.5rem', background: '#e8f4f8', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#2c5282', fontSize: '16px', margin: '0 0 1rem 0' }}>Mint Tokens (Owner Only)</h3>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                <input
                  type="number"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100px' }}
                  placeholder="Amount"
                />
                <button 
                  onClick={handleMint}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#38a169',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Mint {tokenSymbol}
                </button>
              </div>
              {mintStatus && <p style={{ marginTop: '1rem', color: mintStatus.includes('failed') ? '#e74c3c' : '#38a169' }}>{mintStatus}</p>}
            </div>
          )}

          <div style={{ padding: '1rem', background: '#e8f4f8', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ color: '#2c5282', fontSize: '14px', margin: '0 0 0.5rem 0' }}>Token Information</h3>
            <p style={{ margin: '0', fontSize: '12px', color: '#4a5568' }}>
              Contract: {contractAddress ? `${contractAddress.substring(0, 6)}...${contractAddress.substring(contractAddress.length - 4)}` : 'Loading...'}
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#4a5568' }}>
              Total Supply: {totalSupply} {tokenSymbol}
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#4a5568' }}>
              Status: {isOwner ? 'Owner Account ✅' : 'User Account'}
            </p>
          </div>
        </div>
      )}

      {!isCorrectNetwork && account && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1.5rem', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#856404', marginBottom: '0.5rem' }}>⚠️ Network Warning</h3>
          <p style={{ marginBottom: '1rem' }}>Please switch to Sepolia Test Network to interact with your {tokenSymbol} tokens</p>
          <button 
            onClick={switchToSepolia}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Switch to Sepolia
          </button>
        </div>
      )}

      {account && isCorrectNetwork && (
        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          backgroundColor: '#e8f5e8', 
          border: '1px solid #c3e6c3',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#2e7d32', marginBottom: '1rem' }}>🎉 Ready to Use!</h3>
          <p style={{ margin: '0' }}>Your wallet is connected and ready to interact with the {tokenName} smart contract.</p>
        </div>
      )}
    </div>
  );
}

export default App;