
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockEURC.sol";
import "../src/ForexAMM.sol";

contract DeployForex is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        
        MockEURC eurc = new MockEURC();
        console.log("Mock EURC deployed at:", address(eurc));

        
        ForexAMM amm = new ForexAMM(address(eurc));
        console.log("Forex AMM deployed at:", address(amm));

        
        
        eurc.approve(address(amm), 0.1 ether);
        
        amm.addLiquidity{value: 0.1 ether}(0.1 ether);
        
        console.log("Liquidity Added. Ready to swap.");

        vm.stopBroadcast();
    }
}