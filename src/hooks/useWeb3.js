import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';

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
    "constant": false,
    "inputs": [
      {"name": "_from", "type": "address"},
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_spender", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {"name": "_owner", "type": "address"},
      {"name": "_spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "owner", "type": "address"},
      {"indexed": true, "name": "spender", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Approval",
    "type": "event"
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
  const [tokenName, setTokenName] = useState('JING Token');
  const [totalSupply, setTotalSupply] = useState('0');
  const [error, setError] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  
  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const rpcUrl = process.env.REACT_APP_RPC_URL;

  const checkNetwork = useCallback(async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const sepoliaChainId = '0xaa36a7';
        
        console.log('Network check - Current chain ID:', chainId, 'Expected:', sepoliaChainId);
        
        const isCorrect = chainId.toLowerCase() === sepoliaChainId.toLowerCase();
        setIsCorrectNetwork(isCorrect);
        
        if (!isCorrect) {
          console.warn('Wrong network! Please switch to Sepolia');
          setError('Please switch to Sepolia Test Network');
        } else {
          setError('');
        }
      } catch (err) {
        console.error('Error checking network:', err);
        setError('Failed to check network: ' + err.message);
      }
    }
  }, []);

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
        await checkNetwork();
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  }, [checkNetwork]);

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
    console.log('Refresh balance called with:', { account, isCorrectNetwork, contractAddress });
    
    if (!account || !isCorrectNetwork || !contractAddress) {
      console.log('Missing requirements for balance refresh');
      return;
    }
    
    try {
      console.log('Using RPC URL:', rpcUrl);
      const web3 = new Web3(rpcUrl);
      
      const contract = new web3.eth.Contract(JING_TOKEN_ABI, contractAddress);
      
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
      setTokenSymbol(symbol);
      setTokenName(name);
      setTotalSupply(web3.utils.fromWei(supply, 'ether'));
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      
    } catch (err) {
      console.error('Error in refreshBalance:', err);
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