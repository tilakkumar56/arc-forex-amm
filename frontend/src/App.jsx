import { useState, useEffect } from "react";
import { ethers } from "ethers";


const AMM_ADDRESS = "0xf904276Ae5bC2644A679F4a7Bb8f443B81f84F3A";
const EURC_ADDRESS = "0x2635e06e2176b9c8BcB3873D9c0B537D69Ef6ABD";


const AMM_ABI = [
  "function swapUSDCForEURC() external payable",
  "function swapEURCForUSDC(uint256 amount) external",
  "function reserveEURC() view returns (uint256)",
  "function reserveUSDC() view returns (uint256)"
];
const EURC_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];


const colors = {
  background: "#0A1128", 
  cardBg: "#121E3B", 
  textPrimary: "#F0F2F5", 
  textSecondary: "#A0AEC0", 
  accentBlue: "#2196F3", 
  accentSilver: "#C0C9D6", 
  buttonGradient: "linear-gradient(135deg, #2196F3, #C0C9D6)",
  buttonHover: "linear-gradient(135deg, #C0C9D6, #2196F3)",
  buyGreen: "linear-gradient(135deg, #4CAF50, #81C784)",
  sellRed: "linear-gradient(135deg, #F44336, #E57373)"
};

function App() {
  const [account, setAccount] = useState(null);
  const [eurcBalance, setEurcBalance] = useState("0");
  const [reserves, setReserves] = useState({ usdc: "0", eurc: "0" });
  const [amount, setAmount] = useState("");

  
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

  
  const refreshData = async (signer) => {
    const amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, signer);
    const eurc = new ethers.Contract(EURC_ADDRESS, EURC_ABI, signer);

    const rUSDC = await amm.reserveUSDC();
    const rEURC = await amm.reserveEURC();
    const myBal = await eurc.balanceOf(await signer.getAddress());

    setReserves({
      usdc: ethers.formatUnits(rUSDC, 18),
      eurc: ethers.formatUnits(rEURC, 18)
    });
    setEurcBalance(ethers.formatUnits(myBal, 18));
  };

  
  const buyEURC = async () => {
    if (!amount) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, signer);

    try {
      const tx = await amm.swapUSDCForEURC({ value: ethers.parseEther(amount) });
      alert("Swapping... Wait for confirmation.");
      await tx.wait();
      alert("Success! You bought EURC.");
      refreshData(signer);
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  
  const sellEURC = async () => {
    if (!amount) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const amm = new ethers.Contract(AMM_ADDRESS, AMM_ABI, signer);
    const eurc = new ethers.Contract(EURC_ADDRESS, EURC_ABI, signer);

    try {
      
      const approveTx = await eurc.approve(AMM_ADDRESS, ethers.parseEther(amount));
      alert("Approving EURC... Wait.");
      await approveTx.wait();

      
      const tx = await amm.swapEURCForUSDC(ethers.parseEther(amount));
      alert("Selling... Wait for confirmation.");
      await tx.wait();
      alert("Success! You got USDC back.");
      refreshData(signer);
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  
  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px"
  };

  const cardStyle = {
    backgroundColor: colors.cardBg,
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
    width: "100%",
    maxWidth: "500px",
    textAlign: "center",
    border: `1px solid rgba(240, 242, 245, 0.1)`
  };

  const buttonStyle = {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: colors.buttonGradient,
    color: colors.background,
    boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
    transition: "all 0.3s ease"
  };

  const actionButtonStyle = {
    padding: "12px 20px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    flex: "1",
    margin: "0 5px",
    color: "#fff",
    transition: "all 0.3s ease"
  };

  const inputStyle = {
    padding: "12px",
    width: "100%",
    borderRadius: "8px",
    border: `1px solid rgba(240, 242, 245, 0.2)`,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: colors.textPrimary,
    fontSize: "16px",
    marginBottom: "20px"
  };

  const labelStyle = {
    color: colors.textSecondary,
    fontSize: "14px",
    marginBottom: "8px",
    display: "block",
    textAlign: "left"
  };

  const valueStyle = {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "20px"
  };

  const dividerStyle = {
    borderTop: `1px solid rgba(240, 242, 245, 0.1)`,
    margin: "24px 0"
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontWeight: "700", background: colors.buttonGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "24px" }}>
          Arc Forex AMM
        </h1>
        
        {!account ? (
          <button onClick={connect} style={buttonStyle} onMouseOver={(e) => e.target.style.background = colors.buttonHover} onMouseOut={(e) => e.target.style.background = colors.buttonGradient}>
            Connect Wallet
          </button>
        ) : (
          <div>
            <p style={{...labelStyle, textAlign: "center"}}>Connected: <span style={{color: colors.textPrimary}}>{account.slice(0, 6)}...{account.slice(-4)}</span></p>
            
            <div style={dividerStyle} />
            
            <span style={labelStyle}>Your Wallet Balance</span>
            <p style={valueStyle}>{parseFloat(eurcBalance).toFixed(2)} EURC</p>
            
            <div style={dividerStyle} />

            <h3 style={{...labelStyle, fontSize: "18px", marginBottom: "16px"}}>Market Reserves</h3>
            <div style={{display: "flex", justifyContent: "space-between"}}>
              <div style={{textAlign: "left"}}>
                <span style={labelStyle}>Pool USDC</span>
                <p style={valueStyle}>{parseFloat(reserves.usdc).toFixed(2)}</p>
              </div>
              <div style={{textAlign: "right"}}>
                <span style={labelStyle}>Pool EURC</span>
                <p style={valueStyle}>{parseFloat(reserves.eurc).toFixed(2)}</p>
              </div>
            </div>
            
            <div style={dividerStyle} />

            <div style={{ marginTop: "20px" }}>
              <span style={labelStyle}>Amount to Swap</span>
              <input 
                type="number" 
                placeholder="e.g., 0.1" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={inputStyle}
              />
              <div style={{display: "flex", justifyContent: "space-between"}}>
                <button onClick={buyEURC} style={{...actionButtonStyle, background: colors.buyGreen}}>
                  Buy EURC (Pay USDC)
                </button>
                <button onClick={sellEURC} style={{...actionButtonStyle, background: colors.sellRed}}>
                  Sell EURC (Get USDC)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;