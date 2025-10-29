import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrowserProvider,
  Contract,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
  getAddress,
} from "ethers";

// Ethereum Mainnet
const MAINNET_CHAIN_ID_HEX = "0x1";

// Contract address - KEEP THIS ORIGINAL
const CONTRACT_ADDRESS = "0x15c12f6854c88175d2cd1448ffcf668be61cf4aa";

// Corrected Contract ABI that matches JING.sol exactly
const JING_ABI = [
  // Standard ERC20 functions
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Custom functions from your JING.sol contract
  "function tokenPrice() view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function buyTokens() payable",
  "function withdrawETH()",
  "function setTokenPrice(uint256 newPrice)",
  "function owner() view returns (address)"
];

export function useWeb3() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [error, setError] = useState("");

  const [tokenSymbol, setTokenSymbol] = useState("JINGRM");
  const [decimals, setDecimals] = useState(18);
  const [jingBalance, setJingBalance] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
  const [isOwner, setIsOwner] = useState(false);
  const [tokenPriceEth, setTokenPriceEth] = useState("0.001");
  const [ratePerEth, setRatePerEth] = useState("0");
  const [contractBalance, setContractBalance] = useState("0");

  const clearError = useCallback(() => setError(""), []);

  // Contract objects
  const contract = useMemo(() => {
    if (!provider) return null;
    try {
      return new Contract(CONTRACT_ADDRESS, JING_ABI, provider);
    } catch (e) {
      console.error("Contract creation error:", e);
      return null;
    }
  }, [provider]);

  const connectedContract = useMemo(() => {
    if (!signer) return null;
    try {
      return new Contract(CONTRACT_ADDRESS, JING_ABI, signer);
    } catch (e) {
      console.error("Connected contract error:", e);
      return null;
    }
  }, [signer]);

  // Network check
  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected");
      return false;
    }
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== MAINNET_CHAIN_ID_HEX) {
        setError("Please switch to Ethereum Mainnet");
        return false;
      }
      return true;
    } catch (e) {
      console.error("Network check error:", e);
      setError("Network error: " + e.message);
      return false;
    }
  }, []);

  // Get contract ETH balance
  const getContractBalance = useCallback(async () => {
    if (!provider) return "0";
    try {
      const balance = await provider.getBalance(CONTRACT_ADDRESS);
      const formattedBalance = formatEther(balance);
      setContractBalance(formattedBalance);
      return formattedBalance;
    } catch (e) {
      console.error("Get contract balance error:", e);
      setContractBalance("0");
      return "0";
    }
  }, [provider]);

  // Wallet connect
  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not detected");
      
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) return;

      const web3Provider = new BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const s = await web3Provider.getSigner();
      setSigner(s);
      setAccount(getAddress(accounts[0]));
      setError(""); // Clear any previous errors
      
      // Load contract balance after connecting
      await getContractBalance();
    } catch (e) {
      console.error("Connect wallet error:", e);
      setError(e.message);
    }
  }, [checkNetwork, getContractBalance]);

  // Load token info
  const loadTokenBasics = useCallback(async () => {
    if (!contract || !account) return;
    
    try {
      console.log("Loading token basics for account:", account);
      
      const [symbol, dec, supply, priceWei, balance] = await Promise.all([
        contract.symbol().catch(() => "JINGRM"),
        contract.decimals().catch(() => 18),
        contract.totalSupply(),
        contract.tokenPrice(),
        contract.balanceOf(account)
      ]);

      console.log("Token data:", { symbol, dec, supply: supply.toString(), balance: balance.toString() });

      const decimalNumber = Number(dec);
      setTokenSymbol(symbol);
      setDecimals(decimalNumber);
      setTotalSupply(formatUnits(supply, decimalNumber));
      setJingBalance(formatUnits(balance, decimalNumber));

      const priceEth = formatEther(priceWei);
      setTokenPriceEth(priceEth);
      
      // Calculate rate per ETH (1 ETH = X tokens)
      const rate = priceWei > 0 ? (1 / parseFloat(priceEth)).toString() : "0";
      setRatePerEth(rate);
      
      console.log("Final balance:", formatUnits(balance, decimalNumber));
      
    } catch (e) {
      console.error("Load basics error:", e);
      setError("Failed to load token data: " + e.message);
    }
  }, [contract, account]);

  const refreshBalance = useCallback(async () => {
    if (!contract || !account) return;
    try {
      console.log("Refreshing balance for:", account);
      const balance = await contract.balanceOf(account);
      const formattedBalance = formatUnits(balance, decimals);
      console.log("Refreshed balance:", formattedBalance);
      setJingBalance(formattedBalance);
      
      // Also refresh contract balance
      await getContractBalance();
    } catch (e) {
      console.error("Refresh balance error:", e);
      setError("Failed to refresh balance: " + e.message);
    }
  }, [contract, account, decimals, getContractBalance]);

  const checkOwner = useCallback(async () => {
    if (!contract || !account) {
      setIsOwner(false);
      return;
    }
    try {
      const ownerAddr = await contract.owner();
      const isOwnerStatus = ownerAddr.toLowerCase() === account.toLowerCase();
      console.log("Owner check:", { ownerAddr, account, isOwner: isOwnerStatus });
      setIsOwner(isOwnerStatus);
    } catch (e) {
      console.error("Owner check error:", e);
      setIsOwner(false);
    }
  }, [contract, account]);

  // Token functions
  const transferTokens = useCallback(async (to, amount) => {
    if (!connectedContract) throw new Error("Wallet not connected");
    try {
      const amt = parseUnits(String(amount), decimals);
      const tx = await connectedContract.transfer(to, amt);
      await tx.wait();
      await refreshBalance();
      return tx.hash;
    } catch (e) {
      console.error("Transfer error:", e);
      throw e;
    }
  }, [connectedContract, decimals, refreshBalance]);

  const buyTokens = useCallback(async (ethAmount) => {
    if (!connectedContract) throw new Error("Wallet not connected");
    try {
      const tx = await connectedContract.buyTokens({ value: parseEther(String(ethAmount)) });
      await tx.wait();
      await refreshBalance();
      await getContractBalance(); // Update contract balance after purchase
      return tx.hash;
    } catch (e) {
      console.error("Buy tokens error:", e);
      throw e;
    }
  }, [connectedContract, refreshBalance, getContractBalance]);

  const setNewTokenPrice = useCallback(async (newPriceEth) => {
    if (!connectedContract) throw new Error("Wallet not connected");
    if (!isOwner) throw new Error("Only owner can set price");
    try {
      const newPriceWei = parseEther(String(newPriceEth));
      const tx = await connectedContract.setTokenPrice(newPriceWei);
      await tx.wait();
      await loadTokenBasics();
      return tx.hash;
    } catch (e) {
      console.error("Set price error:", e);
      throw e;
    }
  }, [connectedContract, isOwner, loadTokenBasics]);

  const withdrawETH = useCallback(async () => {
    if (!connectedContract) throw new Error("Wallet not connected");
    if (!isOwner) throw new Error("Only owner can withdraw");
    
    try {
      // First check contract balance
      const currentBalance = await getContractBalance();
      console.log("Contract ETH balance:", currentBalance);
      
      if (parseFloat(currentBalance) === 0) {
        throw new Error("Contract has no ETH balance to withdraw");
      }
      
      // FIXED: Use withdrawETH() instead of withdraw()
      const tx = await connectedContract.withdrawETH();
      await tx.wait();
      await getContractBalance(); // Update contract balance after withdrawal
      return tx.hash;
    } catch (e) {
      console.error("Withdraw error details:", e);
      if (e.message.includes("no ETH balance")) {
        throw new Error("Contract has no ETH to withdraw");
      } else if (e.message.includes("require(false)")) {
        throw new Error("Withdrawal rejected by contract - check if you're the owner");
      }
      throw new Error("Withdrawal failed: " + e.message);
    }
  }, [connectedContract, isOwner, getContractBalance]);

  // Auto-load when contract or account changes
  useEffect(() => {
    if (contract && account) {
      console.log("Auto-loading token data...");
      loadTokenBasics();
      checkOwner();
      getContractBalance();
    }
  }, [contract, account, loadTokenBasics, checkOwner, getContractBalance]);

  // Event listeners for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected wallet
        setAccount("");
        setProvider(null);
        setSigner(null);
      } else {
        setAccount(getAddress(accounts[0]));
        // Re-initialize provider and signer
        const web3Provider = new BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        web3Provider.getSigner().then(setSigner);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return {
    account,
    tokenSymbol,
    jingBalance,
    totalSupply,
    isOwner,
    tokenPriceEth,
    ratePerEth,
    contractBalance,
    error,
    connectWallet,
    refreshBalance,
    transferTokens,
    buyTokens,
    setNewTokenPrice,
    withdrawETH,
    clearError,
  };
}