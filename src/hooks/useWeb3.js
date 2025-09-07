import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';

const JING_TOKEN_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initialSupply",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "subtractedValue",
        "type": "uint256"
      }
    ],
    "name": "decreaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "addedValue",
        "type": "uint256"
      }
    ],
    "name": "increaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": 'nonpayable',
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
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
  
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const rpcUrl = process.env.REACT_APP_RPC_URL;

  const connectWallet = useCallback(async () => {
    try {
      setError('');
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        const currentAccount = accounts[0];
        console.log('Connected account:', currentAccount);
        setAccount(currentAccount);
        checkNetwork();
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  }, []);

  const checkNetwork = useCallback(async () => {
    if (window.ethereum) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      // Sepolia chain ID: 0xaa36a7 (11155111 in decimal)
      const sepoliaChainId = '0xaa36a7';
      
      console.log('Network check - Current chain ID:', chainId, 'Expected:', sepoliaChainId);
      console.log('Chain ID in decimal:', parseInt(chainId, 16));
      
      // Use case-insensitive comparison
      const isCorrect = chainId.toLowerCase() === sepoliaChainId.toLowerCase();
      setIsCorrectNetwork(isCorrect);
      
      if (!isCorrect) {
        console.warn('Wrong network! Please switch to Sepolia');
        setError('Please switch to Sepolia Test Network');
      } else {
        setError('');
      }
    }
  }, []);

  const switchToSepolia = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      // Wait a moment for the network change to take effect
      setTimeout(() => checkNetwork(), 1000);
    } catch (err) {
      setError('Failed to switch network: ' + err.message);
    }
  }, [checkNetwork]); // FIXED: Added missing dependency

  const refreshBalance = useCallback(async () => {
    console.log('Refresh balance called with:', { account, isCorrectNetwork, contractAddress });
    
    if (!account || !isCorrectNetwork || !contractAddress) {
      console.log('Missing requirements for balance refresh');
      return;
    }
    
    try {
      console.log('Using RPC URL:', rpcUrl);
      const web3 = new Web3(rpcUrl);
      
      // Test the connection
      try {
        const blockNumber = await web3.eth.getBlockNumber();
        console.log('Current block number:', blockNumber);
      } catch (rpcError) {
        console.error('RPC connection failed:', rpcError);
        setError('RPC connection failed. Please check your network connection.');
        return;
      }
      
      const contract = new web3.eth.Contract(JING_TOKEN_ABI, contractAddress);
      
      // Get token info and balance in parallel
      const [symbol, name, balance, supply, owner] = await Promise.all([
        contract.methods.symbol().call(),
        contract.methods.name().call(),
        contract.methods.balanceOf(account).call(),
        contract.methods.totalSupply().call(),
        contract.methods.owner().call()
      ]);
      
      console.log('Contract symbol:', symbol);
      console.log('Contract name:', name);
      console.log('Raw balance from contract:', balance);
      
      const balanceEth = web3.utils.fromWei(balance, 'ether');
      console.log('Converted balance:', balanceEth, 'JINGRM');
      
      setJingBalance(balanceEth);
      setTokenSymbol(symbol); // FIXED: This is now used
      setTokenName(name);     // FIXED: This is now used
      setTotalSupply(web3.utils.fromWei(supply, 'ether'));
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      
    } catch (err) {
      console.error('Error in refreshBalance:', err);
      setError('Failed to refresh balance: ' + err.message);
    }
  }, [account, isCorrectNetwork, contractAddress, rpcUrl]);

  const mintTokens = useCallback(async (amount) => {
    if (!account || !isCorrectNetwork || !contractAddress) return;
    
    try {
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(JING_TOKEN_ABI, contractAddress);
      
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      const tx = await contract.methods.mint(account, amountInWei).send({ from: account });
      
      await refreshBalance();
      return tx.transactionHash;
    } catch (err) {
      console.error('Error minting tokens:', err);
      throw new Error('Failed to mint tokens: ' + err.message);
    }
  }, [account, isCorrectNetwork, contractAddress, refreshBalance]);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const handleAccountsChanged = (accounts) => {
          if (accounts.length > 0) {
            console.log('Account changed to:', accounts[0]);
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
            console.log('Initial account:', accounts[0]);
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

    // Cleanup function
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
    isOwner,
    contractAddress
  };
};
