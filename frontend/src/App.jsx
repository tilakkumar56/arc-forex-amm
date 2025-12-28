import { useState, useEffect } from "react";
import { ethers } from "ethers";

// --- CONFIGURATION ---
const AMM_ADDRESS = "0xf904276Ae5bC2644A679F4a7Bb8f443B81f84F3A";
const EURC_ADDRESS = "0x2635e06e2176b9c8BcB3873D9c0B537D69Ef6ABD";
const EST_APR = 8.0; // 8% Annual Percentage Rate

// --- ABIs ---
const AMM_ABI = [
  "function swapUSDCForEURC() external payable",
  "function swapEURCForUSDC(uint256 amount) external",
  "function addLiquidity(uint256 amountEURC) external payable returns (uint256 shares)",
  "function reserveEURC() view returns (uint256)",
  "function reserveUSDC() view returns (uint256)"
];
const EURC_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

// --- THEME ---
const theme = {
  bg: "#0A1128",
  card: "#121E3B",
  text: "#F0F2F5",
  subText: "#A0AEC0",
  primary: "#2196F3",
  success: "#4CAF50",
  danger: "#F44336",
  warning: "#FFC107",
  inputBg: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)"
};

function App() {
  const [activeTab, setActiveTab] = useState("swap"); // 'swap' or 'earn'
  const [account, setAccount] = useState(null);
  
  // Market Data
  const [reserves, setReserves] = useState({ usdc: "0", eurc: "0" });
  const [rate, setRate] = useState("0");
  const [userEurc, setUserEurc] = useState("0");

  // Inputs
  const [swapAmount, setSwapAmount] = useState("");
  const [liqUSDC, setLiqUSDC] = useState("");
  const [liqEURC, setLiqEURC] = useState("");

  // Connect Wallet
  const connect = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
      refreshData(signer);
    } else {
      alert("Please install Rabby or MetaMask!");
    }
  };

  // Fetch Data
  const refreshData = async (signer) => {
    const amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, signer);
    const eurc = new ethers.Contract(EURC_ADDRESS, EURC_ABI, signer);

    const rUSDC = await amm.reserveUSDC();
    const rEURC = await amm.reserveEURC();
    const myBal = await eurc.balanceOf(await signer.getAddress());

    const usdcF = parseFloat(ethers.formatUnits(rUSDC, 18));
    const eurcF = parseFloat(ethers.formatUnits(rEURC, 18));

    setReserves({ usdc: usdcF.toFixed(2), eurc: eurcF.toFixed(2) });
    setUserEurc(ethers.formatUnits(myBal, 18));

    if (eurcF > 0) {
      setRate((usdcF / eurcF).toFixed(4));
    }
  };

  // --- ACTIONS ---
  const handleBuy = async () => {
    if(!swapAmount) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, signer);
    try {
      const tx = await amm.swapUSDCForEURC({ value: ethers.parseEther(swapAmount) });
      await tx.wait();
      alert("Bought EURC!");
      refreshData(signer);
    } catch(e) { alert(e.message); }
  };

  const handleSell = async () => {
    if(!swapAmount) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, signer);
    const eurc = new ethers.Contract(EURC_ADDRESS, EURC_ABI, signer);
    try {
      await (await eurc.approve(AMM_ADDRESS, ethers.parseEther(swapAmount))).wait();
      await (await amm.swapEURCForUSDC(ethers.parseEther(swapAmount))).wait();
      alert("Sold EURC!");
      refreshData(signer);
    } catch(e) { alert(e.message); }
  };

  const handleAddLiquidity = async () => {
    if(!liqUSDC || !liqEURC) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, signer);
    const eurc = new ethers.Contract(EURC_ADDRESS, EURC_ABI, signer);
    try {
      // 1. Approve EURC
      const approveTx = await eurc.approve(AMM_ADDRESS, ethers.parseEther(liqEURC));
      await approveTx.wait();
      
      // 2. Deposit Both
      const tx = await amm.addLiquidity(ethers.parseEther(liqEURC), { value: ethers.parseEther(liqUSDC) });
      await tx.wait();
      alert("Liquidity Added! You are now earning fees.");
      refreshData(signer);
    } catch(e) { 
      console.error(e);
      alert("Error: " + e.message); 
    }
  };

  // --- UI COMPONENTS ---
  const NavButton = ({ title, id }) => (
    <button 
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1, padding: "12px", border: "none", cursor: "pointer", fontWeight: "bold",
        borderBottom: activeTab === id ? `3px solid ${theme.primary}` : "3px solid transparent",
        background: "transparent", color: activeTab === id ? theme.primary : theme.subText,
        transition: "all 0.3s"
      }}
    >
      {title}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: theme.card, width: "450px", borderRadius: "16px", padding: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.4)", border: theme.border }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontWeight: "800", background: "linear-gradient(90deg, #2196F3, #E040FB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Arc DeFi
          </h2>
          {!account ? (
            <button onClick={connect} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: theme.primary, color: "white", cursor: "pointer", fontWeight: "bold" }}>Connect</button>
          ) : (
            <span style={{ fontSize: "12px", color: theme.success, background: "rgba(76, 175, 80, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>● {account.slice(0,6)}...</span>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: "flex", marginBottom: "20px", borderBottom: theme.border }}>
          <NavButton title="Trade" id="swap" />
          <NavButton title="Earn (8% APR)" id="earn" />
        </div>

        {/* --- SWAP TAB --- */}
        {activeTab === 'swap' && (
          <div>
            <div style={{ background: "rgba(33, 150, 243, 0.1)", padding: "15px", borderRadius: "12px", marginBottom: "20px", textAlign: "center" }}>
              <span style={{ display: "block", fontSize: "12px", color: theme.primary, fontWeight: "bold", marginBottom: "5px" }}>CURRENT RATE</span>
              <span style={{ fontSize: "24px", fontWeight: "bold" }}>1 EURC ≈ {rate} USDC</span>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: theme.subText, marginBottom: "5px", display: "block" }}>Amount to Swap</label>
              <input type="number" placeholder="0.0" value={swapAmount} onChange={e => setSwapAmount(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: theme.border, background: theme.inputBg, color: "white", fontSize: "18px" }} />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleBuy} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: theme.success, color: "white", fontWeight: "bold", cursor: "pointer" }}>Buy EURC</button>
              <button onClick={handleSell} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: theme.danger, color: "white", fontWeight: "bold", cursor: "pointer" }}>Sell EURC</button>
            </div>
          </div>
        )}

        {/* --- EARN TAB (LIQUIDITY) --- */}
        {activeTab === 'earn' && (
          <div>
            <div style={{ background: "linear-gradient(135deg, #6200EA, #B388FF)", padding: "20px", borderRadius: "12px", marginBottom: "25px", color: "white", textAlign: "center", boxShadow: "0 4px 15px rgba(98, 0, 234, 0.4)" }}>
              <h3 style={{ margin: "0 0 5px 0" }}>Liquidity Provider</h3>
              <p style={{ margin: 0, opacity: 0.8, fontSize: "14px" }}>Provide liquidity and earn trading fees.</p>
              <h1 style={{ margin: "15px 0 5px 0", fontSize: "36px" }}>{EST_APR}%</h1>
              <span style={{ fontSize: "12px", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "4px" }}>FIXED APR</span>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "12px", color: theme.subText, marginBottom: "5px", display: "block" }}>Deposit USDC</label>
              <input type="number" placeholder="0.0" value={liqUSDC} onChange={e => setLiqUSDC(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: theme.border, background: theme.inputBg, color: "white", fontSize: "16px", marginBottom: "15px" }} />
              
              <label style={{ fontSize: "12px", color: theme.subText, marginBottom: "5px", display: "block" }}>Deposit EURC</label>
              <input type="number" placeholder="0.0" value={liqEURC} onChange={e => setLiqEURC(e.target.value)} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: theme.border, background: theme.inputBg, color: "white", fontSize: "16px" }} />
            </div>

            <button onClick={handleAddLiquidity} style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: "linear-gradient(90deg, #2196F3, #E040FB)", color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer", boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)" }}>
              + Add Liquidity & Earn
            </button>
            
            <p style={{ textAlign: "center", fontSize: "12px", color: theme.subText, marginTop: "15px" }}>
              Your funds will be added to the pool reserves of<br/>
              <b>{reserves.usdc} USDC</b> and <b>{reserves.eurc} EURC</b>.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;