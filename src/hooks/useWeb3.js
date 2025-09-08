import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';

const JING_TOKEN_ABI = [
  // ... (same ABI as before)
];

export const useWeb3 = () => {
  const [account, setAccount] = useState(null);
  const [jingBalance, setJingBalance] = useState('0');
  const [tokenSymbol, setTokenSymbol] = useState('JINGRM');
  const [tokenName, setTokenName] = useState('JING Token');
  const [totalSupply, setTotalSupply] = useState('0');
  const [error, setError] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const rpcUrl = process.env.REACT_APP_RPC_URL;

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const addTransactionToHistory = useCallback((tx) => {
    setTransactionHistory(prev => [tx, ...prev].slice(0, 10)); // Keep only last 10 transactions
  }, []);

  const checkNetwork = useCallback(async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const sepoliaChainId = '0xaa36a7';
        
        const isCorrect = chainId.toLowerCase() === sepoliaChainId.toLowerCase();
        setIsCorrectNetwork(isCorrect);
        
        if (!isCorrect) {
          setError('Please switch to Sepolia Test Network');
        } else {
          clearError();
        }
      } catch (err) {
        setError('Failed to check network: ' + err.message);
      }
    }
  }, [clearError]);

  const connectWallet = useCallback(async () => {
    try {
      clearError();
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        const currentAccount = accounts[0];
        setAccount(currentAccount);
        await checkNetwork();
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  }, [checkNetwork, clearError]);

  const switchToSepolia = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      setTimeout(() => checkNetwork(), 1000);
    } catch (err) {
      setError('Failed to switch network: ' + err.message);
    }
  }, [checkNetwork]);

  const refreshBalance = useCallback(async () => {
    if (!account || !isCorrectNetwork || !contractAddress) return;
    
    try {
      const web3 = new Web3(rpcUrl);
      const contract = new web3.eth.Contract(JING_TOKEN_ABI, contractAddress);
      
      const [symbol, name, balance, supply, owner] = await Promise.all([
        contract.methods.symbol().call(),
        contract.methods.name().call(),
        contract.methods.balanceOf(account).call(),
        contract.methods.totalSupply().call(),
        contract.methods.owner().call()
      ]);
      
      const balanceEth = web3.utils.fromWei(balance, 'ether');
      
      setJingBalance(balanceEth);
      setTokenSymbol(symbol);
      setTokenName(name);
      setTotalSupply(web3.utils.fromWei(supply, 'ether'));
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      
    } catch (err) {
      setError('Failed to refresh balance: ' + err.message);
    }
  }, [account, isCorrectNetwork, contractAddress, rpcUrl]);

  const mintTokens = useCallback(async (amount) => {
    if (!account || !isCorrectNetwork || !contractAddress) {
      throw new Error('Wallet not connected or wrong network');
    }
    
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(JING_TOKEN_ABI, contractAddress);
      
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      const tx = await contract.methods.mint(account, amountInWei).send({ from: account });
      
      // Add to transaction history
      addTransactionToHistory({
        hash: tx.transactionHash,
        type: 'Mint',
        amount: amount,
        timestamp: Date.now()
      });
      
      await refreshBalance();
      return tx.transactionHash;
    } catch (err) {
      throw new Error('Failed to mint tokens: ' + err.message);
    }
  }, [account, isCorrectNetwork, contractAddress, refreshBalance, addTransactionToHistory]);

  const transferTokens = useCallback(async (toAddress, amount) => {
    if (!account || !isCorrectNetwork || !contractAddress) {
      throw new Error('Wallet not connected or wrong network');
    }
    
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(JING_TOKEN_ABI, contractAddress);
      
      // Validate address
      if (!web3.utils.isAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }
      
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      const tx = await contract.methods.transfer(toAddress, amountInWei).send({ from: account });
      
      // Add to transaction history
      addTransactionToHistory({
        hash: tx.transactionHash,
        type: 'Transfer',
        amount: amount,
        to: toAddress,
        timestamp: Date.now()
      });
      
      await refreshBalance();
      return tx.transactionHash;
    } catch (err) {
      throw new Error('Transfer failed: ' + err.message);
    }
  }, [account, isCorrectNetwork, contractAddress, refreshBalance, addTransactionToHistory]);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const handleAccountsChanged = (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            setAccount(null);
          }
        };

        const handleChainChanged = () => {
          window.location.reload();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error('Error getting accounts:', error);
        }

        checkNetwork();
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [checkNetwork]);

  useEffect(() => {
    if (account && isCorrectNetwork && contractAddress) {
      refreshBalance();
    }
  }, [account, isCorrectNetwork, contractAddress, refreshBalance]);

  return {
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
    transferTokens,
    isOwner,
    contractAddress,
    transactionHistory,
    clearError
  };
};