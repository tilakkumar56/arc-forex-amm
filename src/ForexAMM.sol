
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract ForexAMM {
    IERC20 public immutable eurcToken;

    uint256 public reserveUSDC;
    uint256 public reserveEURC;

    event Swap(address indexed user, string direction, uint256 amountIn, uint256 amountOut);
    event LiquidityAdded(address indexed provider, uint256 usdcAmount, uint256 eurcAmount);

    constructor(address _eurcToken) {
        eurcToken = IERC20(_eurcToken);
    }

    
    function addLiquidity(uint256 _eurcAmount) external payable {
        require(msg.value > 0 && _eurcAmount > 0, "Zero amounts");
        
        eurcToken.transferFrom(msg.sender, address(this), _eurcAmount);

        reserveUSDC += msg.value;
        reserveEURC += _eurcAmount;

        emit LiquidityAdded(msg.sender, msg.value, _eurcAmount);
    }

    
    function swapUSDCForEURC() external payable {
        require(msg.value > 0, "Send USDC");

        
        
        uint256 amountInWithFee = msg.value * 997;
        uint256 numerator = amountInWithFee * reserveEURC;
        uint256 denominator = (reserveUSDC * 1000) + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        require(amountOut > 0, "Insufficient output amount");
        require(reserveEURC >= amountOut, "Insufficient liquidity");

        reserveUSDC += msg.value;
        reserveEURC -= amountOut;

        eurcToken.transfer(msg.sender, amountOut);
        
        emit Swap(msg.sender, "USDC -> EURC", msg.value, amountOut);
    }

    
    function swapEURCForUSDC(uint256 _eurcAmount) external {
        require(_eurcAmount > 0, "Send EURC");

        uint256 amountInWithFee = _eurcAmount * 997;
        uint256 numerator = amountInWithFee * reserveUSDC;
        uint256 denominator = (reserveEURC * 1000) + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        require(amountOut > 0, "Insufficient output amount");
        require(reserveUSDC >= amountOut, "Insufficient liquidity");

        eurcToken.transferFrom(msg.sender, address(this), _eurcAmount);

        reserveEURC += _eurcAmount;
        reserveUSDC -= amountOut;

        
        (bool success, ) = payable(msg.sender).call{value: amountOut}("");
        require(success, "Transfer failed");

        emit Swap(msg.sender, "EURC -> USDC", _eurcAmount, amountOut);
    }

    
    function getRate() external view returns (uint256 usdcReserve, uint256 eurcReserve) {
        return (reserveUSDC, reserveEURC);
    }
}