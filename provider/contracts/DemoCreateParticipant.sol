pragma solidity ^0.4.8;

import './Participant.sol';

contract DemoCreateParticipant {

    function createParticipant(address _owner) returns (Participant participant) {
        participant = new Participant(_owner);
    }
}
