import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';

// Standard ERC20 ABI with only the essential functions
const JING_TOKEN_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export const useWeb3 = () => {
  const [account, setAccount] = useState(null);
  const [jingBalance, setJingBalance] = useState('0');
  const [tokenSymbol, setTokenSymbol] = useState('JINGRM');
  const [totalSupply, setTotalSupply] = useState('0');
  const [error, setError] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const rpcUrl = process.env.REACT_APP_RPC_URL || 'https://sepolia.infura.io/v3/';

  const clearError = useCallback(() => {
    setError('');
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
        console.error('Network check error:', err);
        setError('Failed to check network');
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
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          await checkNetwork();
        }
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError('Failed to connect wallet');
    }
  }, [checkNetwork, clearError]);

  const switchToSepolia = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      // Wait a bit for the network to switch
      setTimeout(() => checkNetwork(), 1000);
    } catch (err) {
      console.error('Network switch error:', err);
      setError('Failed to switch network');
    }
  }, [checkNetwork]);

  const refreshBalance = useCallback(async () => {
    if (!account || !isCorrectNetwork || !contractAddress) {
      console.log('Cannot refresh balance - missing requirements');
      return;
    }
    
    try {
      console.log('Refreshing balance...');
      
      // Use window.ethereum instead of RPC URL for better reliability
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(JING_TOKEN_ABI, contractAddress);
      
      // Test basic contract call first
      try {
        const symbol = await contract.methods.symbol().call();
        console.log('Contract symbol:', symbol);
        setTokenSymbol(symbol);
      } catch (symbolError) {
        console.warn('Symbol call failed, using default:', symbolError);
      }
      
      // Get balance
      const balance = await contract.methods.balanceOf(account).call();
      console.log('Raw balance:', balance);
      
      const balanceEth = Web3.utils.fromWei(balance, 'ether');
      console.log('Formatted balance:', balanceEth);
      
      setJingBalance(balanceEth);
      
      // Get total supply
      try {
        const supply = await contract.methods.totalSupply().call();
        setTotalSupply(Web3.utils.fromWei(supply, 'ether'));
      } catch (supplyError) {
        console.warn('Total supply call failed:', supplyError);
      }
      
      // Check if owner
      try {
        const owner = await contract.methods.owner().call();
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
      } catch (ownerError) {
        console.warn('Owner check failed:', ownerError);
        setIsOwner(false);
      }
      
    } catch (err) {
      console.error('Balance refresh error:', err);
      setError('Failed to refresh balance: ' + (err.message || 'Contract interaction failed'));
    }
  }, [account, isCorrectNetwork, contractAddress]);

  const mintTokens = useCallback(async (amount) => {
    if (!account || !isCorrectNetwork || !contractAddress) {
      throw new Error('Wallet not connected or wrong network');
    }
    
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(JING_TOKEN_ABI, contractAddress);
      
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      const tx = await contract.methods.mint(account, amountInWei).send({ 
        from: account 
      });
      
      // Refresh balance after minting
      setTimeout(() => refreshBalance(), 2000);
      
      return tx.transactionHash;
    } catch (err) {
      console.error('Mint error:', err);
      throw new Error('Failed to mint tokens: ' + (err.message || 'Transaction failed'));
    }
  }, [account, isCorrectNetwork, contractAddress, refreshBalance]);

  const transferTokens = useCallback(async (toAddress, amount) => {
    if (!account || !isCorrectNetwork || !contractAddress) {
      throw new Error('Wallet not connected or wrong network');
    }
    
    try {
      const web3 = new Web3(window.ethereum);
      
      // Validate address
      if (!web3.utils.isAddress(toAddress)) {
        throw new Error('Invalid Ethereum address');
      }
      
      const contract = new web3.eth.Contract(JING_TOKEN_ABI, contractAddress);
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      
      const tx = await contract.methods.transfer(toAddress, amountInWei).send({ 
        from: account 
      });
      
      // Refresh balance after transfer
      setTimeout(() => refreshBalance(), 2000);
      
      return tx.transactionHash;
    } catch (err) {
      console.error('Transfer error:', err);
      throw new Error('Transfer failed: ' + (err.message || 'Transaction failed'));
    }
  }, [account, isCorrectNetwork, contractAddress, refreshBalance]);

  // Initialize and set up event listeners
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        // Set up event listeners
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

        // Check if already connected
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

        // Check network
        await checkNetwork();
        
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setError('MetaMask not detected');
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

  // Refresh balance when account, network, or contract changes
  useEffect(() => {
    if (account && isCorrectNetwork && contractAddress) {
      refreshBalance();
    }
  }, [account, isCorrectNetwork, contractAddress, refreshBalance]);

  return {
    account,
    jingBalance,
    tokenSymbol,
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
    clearError
  };
};