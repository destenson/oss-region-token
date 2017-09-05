pragma solidity ^0.4.8;

import '../../gmo/contracts/VersionLogic.sol';
import './Demo.sol';
import './RegionToken.sol';
import './DemoCreateParticipant.sol';

contract DemoLogic_v1 is VersionLogic, Demo {
    DemoCreateParticipant demoCreateParticipant;

    // This is a sample contract, so don't create event contract
    event CreateToken(address _token);

    function DemoLogic_v1(ContractNameService _cns, DemoCreateParticipant _demoCreateParticipant) VersionLogic (_cns, CONTRACT_NAME) {
        demoCreateParticipant = _demoCreateParticipant;
    }

    function createToken(address _caller, bytes32 _symbol, bytes32 _name) onlyByVersionContractOrLogic {
        // split createToken and createParticipant, because the contract with createToken and createParticipant is too large to deploy.
        RegionToken token = new RegionToken(demoCreateParticipant.createParticipant(_caller), _symbol, _name);
        CreateToken(token);
    }
}
