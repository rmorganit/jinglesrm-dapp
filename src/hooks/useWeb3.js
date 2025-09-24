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
const MAINNET_RPC_FALLBACK =
  "https://eth-mainnet.g.alchemy.com/v2/qDGrM1Ww_-k8YtrAHwJGU1iwTT960GK8";

// Contract address
const DEFAULT_CONTRACT_ADDRESS =
  process.env.REACT_APP_JING_ADDRESS ||
  "0x15c12f6854c88175d2cd1448ffcf668be61cf4aa";

// Contract ABI
const JING_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function tokenPrice() view returns (uint256)",
  "function setTokenPrice(uint256 newPrice)",
  "function buyTokens() payable",
  "function withdrawETH()",
  "function owner() view returns (address)",
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

  const contractAddress = DEFAULT_CONTRACT_ADDRESS;

  const clearError = useCallback(() => setError(""), []);

  // Contract objects
  const contract = useMemo(() => {
    if (!provider) return null;
    return new Contract(contractAddress, JING_ABI, provider);
  }, [provider]);

  const connectedContract = useMemo(() => {
    if (!signer) return null;
    return new Contract(contractAddress, JING_ABI, signer);
  }, [signer]);

  // Network check
  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return setIsCorrectNetwork(false);
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    setIsCorrectNetwork(chainId === MAINNET_CHAIN_ID_HEX);
  }, []);

  const switchToMainnet = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MAINNET_CHAIN_ID_HEX }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: MAINNET_CHAIN_ID_HEX,
              chainName: "Ethereum Mainnet",
              rpcUrls: [MAINNET_RPC_FALLBACK],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://etherscan.io"],
            },
          ],
        });
      } else {
        setError(`Switch error: ${err.message}`);
      }
    }
    await checkNetwork();
  }, [checkNetwork]);

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
      setError(e.message);
    }
  }, [checkNetwork]);

  // Load token info
  const loadTokenBasics = useCallback(async () => {
    if (!contract) return;
    try {
      const [symbol, dec, supply, priceWei] = await Promise.all([
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.tokenPrice(),
      ]);

      setTokenSymbol(symbol);
      setDecimals(Number(dec));
      setTotalSupply(formatUnits(supply, dec));

      const priceEth = formatEther(priceWei);
      setTokenPriceEth(priceEth);

      if (priceWei > 0n) {
        setRatePerEth((1 / parseFloat(priceEth)).toString());
      } else {
        setRatePerEth("0");
      }
    } catch (e) {
      setError(`Load basics failed: ${e.message}`);
    }
  }, [contract]);

  const refreshBalance = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const bal = await contract.balanceOf(account);
      setJingBalance(formatUnits(bal, decimals));
    } catch (e) {
      setError(`Balance error: ${e.message}`);
    }
  }, [contract, account, decimals]);

  const checkOwner = useCallback(async () => {
    if (!contract || !account) return setIsOwner(false);
    try {
      const ownerAddr = await contract.owner();
      setIsOwner(ownerAddr.toLowerCase() === account.toLowerCase());
    } catch {
      setIsOwner(false);
    }
  }, [contract, account]);

  // Token functions
  const mintTokens = useCallback(
    async (amount) => {
      if (!connectedContract) throw new Error("Wallet not connected");
      const amt = parseUnits(String(amount), decimals);
      const tx = await connectedContract.mint(account, amt);
      await tx.wait();
      await refreshBalance();
      return tx.hash;
    },
    [connectedContract, account, decimals, refreshBalance]
  );

  const transferTokens = useCallback(
    async (to, amount) => {
      if (!connectedContract) throw new Error("Wallet not connected");
      const amt = parseUnits(String(amount), decimals);
      const tx = await connectedContract.transfer(to, amt);
      await tx.wait();
      await refreshBalance();
      return tx.hash;
    },
    [connectedContract, decimals, refreshBalance]
  );

  const buyTokens = useCallback(
    async (ethAmount) => {
      if (!connectedContract) throw new Error("Wallet not connected");
      const tx = await connectedContract.buyTokens({
        value: parseEther(String(ethAmount)),
      });
      await tx.wait();
      await refreshBalance();
      return tx.hash;
    },
    [connectedContract, refreshBalance]
  );

  const setNewTokenPrice = useCallback(
    async (newPriceEth) => {
      if (!connectedContract) throw new Error("Wallet not connected");
      if (!isOwner) throw new Error("Only owner can set price");
      const newPriceWei = parseEther(String(newPriceEth));
      const tx = await connectedContract.setTokenPrice(newPriceWei);
      await tx.wait();
      await loadTokenBasics();
      return tx.hash;
    },
    [connectedContract, isOwner, loadTokenBasics]
  );

  const withdrawETH = useCallback(async () => {
    if (!connectedContract) throw new Error("Wallet not connected");
    if (!isOwner) throw new Error("Only owner can withdraw");
    const tx = await connectedContract.withdrawETH();
    await tx.wait();
    return tx.hash;
  }, [connectedContract, isOwner]);

  const getContractBalance = useCallback(async () => {
    if (!provider || !contractAddress) return "0";
    try {
      const bal = await provider.getBalance(contractAddress);
      return formatEther(bal);
    } catch (e) {
      setError(`Contract balance error: ${e.message}`);
      return "0";
    }
  }, [provider, contractAddress]);

  // Auto-load
  useEffect(() => {
    if (contract) loadTokenBasics();
  }, [contract, loadTokenBasics]);

  useEffect(() => {
    if (contract && account) {
      refreshBalance();
      checkOwner();
    }
  }, [contract, account, refreshBalance, checkOwner]);

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.on?.("accountsChanged", () => window.location.reload());
    window.ethereum.on?.("chainChanged", () => window.location.reload());
  }, []);

  return {
    account,
    tokenSymbol,
    decimals,
    jingBalance,
    totalSupply,
    isOwner,
    isCorrectNetwork,
    contractAddress,
    tokenPriceEth,
    ratePerEth,
    error,
    connectWallet,
    switchToMainnet,
    refreshBalance,
    mintTokens,
    transferTokens,
    buyTokens,
    setNewTokenPrice,
    withdrawETH,
    getContractBalance,
    clearError,
  };
}


