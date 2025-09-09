import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import JING_TOKEN_ABI from '../abis/JINGRM.json';

const CONTRACT_ADDRESS = "0xaf0aD1C3a92E8CF5E8425b4d90A84E9825781a33";

export const useWeb3 = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [jingContract, setJingContract] = useState(null);
  const [jingBalance, setJingBalance] = useState('0');
  const [tokenSymbol, setTokenSymbol] = useState('JINGRM');
  const [totalSupply, setTotalSupply] = useState('0');
  const [error, setError] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const SEPOLIA_CHAIN_ID = '0xaa36a7';

  const clearError = () => setError(null);

  const checkNetwork = useCallback(async (web3Instance) => {
    if (!web3Instance) return false;
    try {
      const chainId = await web3Instance.eth.getChainId();
      const isSepolia = chainId === parseInt(SEPOLIA_CHAIN_ID, 16);
      setIsCorrectNetwork(isSepolia);
      return isSepolia;
    } catch (err) {
      console.error('Error checking network:', err);
      return false;
    }
  }, [SEPOLIA_CHAIN_ID]);

  const switchToSepolia = async () => {
    try {
      if (!window.ethereum) throw new Error('MetaMask not installed');
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      
      // Reload the page after network switch
      window.location.reload();
    } catch (err) {
      setError(`Failed to switch network: ${err.message}`);
    }
  };

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error('MetaMask not installed');

      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) throw new Error('No accounts found');

      const account = accounts[0];
      setAccount(account);

      // Check network
      await checkNetwork(web3Instance);

      // Initialize contract
      const contract = new web3Instance.eth.Contract(JING_TOKEN_ABI.abi || JING_TOKEN_ABI, CONTRACT_ADDRESS);
      setJingContract(contract);

      return account;
    } catch (err) {
      setError(`Connection failed: ${err.message}`);
      throw err;
    }
  }, [checkNetwork]);

  const refreshBalance = useCallback(async () => {
    if (!jingContract || !account) return;
    
    try {
      const balance = await jingContract.methods.balanceOf(account).call();
      const supply = await jingContract.methods.totalSupply().call();
      const symbol = await jingContract.methods.symbol().call();
      
      setJingBalance(Web3.utils.fromWei(balance, 'ether'));
      setTotalSupply(Web3.utils.fromWei(supply, 'ether'));
      setTokenSymbol(symbol);

      // Check if user is owner
      const owner = await jingContract.methods.owner().call();
      setIsOwner(owner.toLowerCase() === account.toLowerCase());

    } catch (err) {
      setError(`Failed to refresh balance: ${err.message}`);
      throw err;
    }
  }, [jingContract, account]);

  const mintTokens = async (amount) => {
    if (!jingContract || !web3) throw new Error('Contract not initialized');
    
    try {
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      const tx = await jingContract.methods.mint(amountInWei).send({ from: account });
      await refreshBalance();
      return tx.transactionHash;
    } catch (err) {
      setError(`Mint failed: ${err.message}`);
      throw err;
    }
  };

  const transferTokens = async (toAddress, amount) => {
    if (!jingContract || !web3) throw new Error('Contract not initialized');
    
    try {
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      const tx = await jingContract.methods.transfer(toAddress, amountInWei).send({ from: account });
      await refreshBalance();
      return tx.transactionHash;
    } catch (err) {
      setError(`Transfer failed: ${err.message}`);
      throw err;
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      // Auto-connect if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            connectWallet();
          }
        });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setJingContract(null);
        } else {
          setAccount(accounts[0]);
          if (web3) {
            const contract = new web3.eth.Contract(JING_TOKEN_ABI.abi || JING_TOKEN_ABI, CONTRACT_ADDRESS);
            setJingContract(contract);
            refreshBalance();
          }
        }
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, [connectWallet, web3, refreshBalance]);

  return {
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
    contractAddress: CONTRACT_ADDRESS,
    clearError
  };
};