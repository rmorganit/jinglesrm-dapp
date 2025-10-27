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
const MAINNET_RPC_FALLBACK = "https://eth-mainnet.g.alchemy.com/v2/qDGrM1Ww_-k8YtrAHwJGU1iwTT960GK8";

// Contract address
const CONTRACT_ADDRESS = "0x15c12f6854c88175d2cd1448ffcf668be61cf4aa";

// Contract ABI
const JING_ABI = [
  // Standard ERC20
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  
  // Custom functions
  "function tokenPrice() view returns (uint256)",
  "function setTokenPrice(uint256 newPrice)",
  "function buyTokens() payable",
  "function withdraw()",
  "function owner() view returns (address)"
];

export function useWeb3() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [error, setError] = useState("");

  const [tokenSymbol, setTokenSymbol] = useState("JINGRM");
  const [decimals, setDecimals] = useState(18);
  const [jingBalance, setJingBalance] = useState("0");
  const [totalSupply, setTotalSupply] = useState("0");
  const [isOwner, setIsOwner] = useState(false);
  const [tokenPriceEth, setTokenPriceEth] = useState("0.001");
  const [ratePerEth, setRatePerEth] = useState("0");

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
    if (!window.ethereum) return setIsCorrectNetwork(false);
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      setIsCorrectNetwork(chainId === MAINNET_CHAIN_ID_HEX);
    } catch (e) {
      console.error("Network check error:", e);
    }
  }, []);

  // Wallet connect
  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not detected");
      
      await checkNetwork();

      const web3Provider = new BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const s = await web3Provider.getSigner();
      setSigner(s);
      setAccount(getAddress(accounts[0]));
    } catch (e) {
      console.error("Connect wallet error:", e);
      setError(e.message);
    }
  }, [checkNetwork]);

  // Load token info
  const loadTokenBasics = useCallback(async () => {
    if (!contract || !account) return;
    
    try {
      const [symbol, dec, supply, priceWei, balance] = await Promise.all([
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.tokenPrice(),
        contract.balanceOf(account)
      ]);

      setTokenSymbol(symbol);
      setDecimals(Number(dec));
      setTotalSupply(formatUnits(supply, dec));
      setJingBalance(formatUnits(balance, dec));

      const priceEth = formatEther(priceWei);
      setTokenPriceEth(priceEth);
      setRatePerEth(priceWei > 0 ? (1 / parseFloat(priceEth)).toString() : "0");
      
    } catch (e) {
      console.error("Load basics error:", e);
      setError("Contract connection failed: " + e.message);
    }
  }, [contract, account]);

  const refreshBalance = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const bal = await contract.balanceOf(account);
      setJingBalance(formatUnits(bal, decimals));
    } catch (e) {
      console.error("Refresh balance error:", e);
    }
  }, [contract, account, decimals]);

  const checkOwner = useCallback(async () => {
    if (!contract || !account) {
      setIsOwner(false);
      return;
    }
    try {
      const ownerAddr = await contract.owner();
      setIsOwner(ownerAddr.toLowerCase() === account.toLowerCase());
    } catch (e) {
      console.error("Owner check error:", e);
      setIsOwner(false);
    }
  }, [contract, account]);

  // Token functions
  const transferTokens = useCallback(async (to, amount) => {
    if (!connectedContract) throw new Error("Wallet not connected");
    const amt = parseUnits(String(amount), decimals);
    const tx = await connectedContract.transfer(to, amt);
    await tx.wait();
    await refreshBalance();
    return tx.hash;
  }, [connectedContract, decimals, refreshBalance]);

  const buyTokens = useCallback(async (ethAmount) => {
    if (!connectedContract) throw new Error("Wallet not connected");
    const tx = await connectedContract.buyTokens({ value: parseEther(String(ethAmount)) });
    await tx.wait();
    await refreshBalance();
    return tx.hash;
  }, [connectedContract, refreshBalance]);

  const setNewTokenPrice = useCallback(async (newPriceEth) => {
    if (!connectedContract) throw new Error("Wallet not connected");
    if (!isOwner) throw new Error("Only owner can set price");
    const newPriceWei = parseEther(String(newPriceEth));
    const tx = await connectedContract.setTokenPrice(newPriceWei);
    await tx.wait();
    await loadTokenBasics();
    return tx.hash;
  }, [connectedContract, isOwner, loadTokenBasics]);

  const withdrawETH = useCallback(async () => {
    if (!connectedContract) throw new Error("Wallet not connected");
    if (!isOwner) throw new Error("Only owner can withdraw");
    const tx = await connectedContract.withdraw();
    await tx.wait();
    return tx.hash;
  }, [connectedContract, isOwner]);

  // Auto-load
  useEffect(() => {
    if (contract && account) {
      loadTokenBasics();
      checkOwner();
    }
  }, [contract, account, loadTokenBasics, checkOwner]);

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.on?.("accountsChanged", () => window.location.reload());
    window.ethereum.on?.("chainChanged", () => window.location.reload());
  }, []);

  return {
    account,
    tokenSymbol,
    jingBalance,
    totalSupply,
    isOwner,
    tokenPriceEth,
    ratePerEth,
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