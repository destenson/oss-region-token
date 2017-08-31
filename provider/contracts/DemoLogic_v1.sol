pragma solidity ^0.4.8;

import '../../gmo/contracts/VersionLogic.sol';
import './Demo.sol';
import './RegionToken.sol';

contract DemoLogic_v1 is VersionLogic, Demo {
    // This is a sample contract, so don't create event contract
    event CreateToken(address _token);

    function DemoLogic_v1(ContractNameService _cns) VersionLogic (_cns, CONTRACT_NAME) {}

    function createToken(address _caller, bytes32 _symbol, bytes32 _name) onlyByVersionContractOrLogic {
        address token = new RegionToken(_caller, _symbol, _name);
        CreateToken(token);
    }
}
