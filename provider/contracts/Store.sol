pragma solidity ^0.4.8;

contract Store {
    address public participant = msg.sender;
    address public regionToken;

    bytes32 public name;
    bool public active = true;
    address public master;
    uint public maxLiabilities;
    uint public liabilities;
    mapping (address => bool) public terminals;

    function Store(address _regionToken, bytes32 _name, address _master, uint _maxLiabilities) {
        regionToken = _regionToken;
        name = _name;
        master = _master;
        maxLiabilities = _maxLiabilities;
    }

    /* ----------- modifier ----------------- */

    modifier onlyParticipant() {
        assert (participant == msg.sender);
        _;
    }

    modifier onlyRegionToken() {
        assert (regionToken == msg.sender);
        _;
    }

    /* ----------- methods ----------------- */

    function increaseLiabilities(uint _amount) onlyRegionToken returns (bool success) {
        liabilities += _amount;
        return true;
    }

    function reduceLiabilities(uint _amount) onlyRegionToken returns (bool success) {
        liabilities -= _amount;
        return true;
    }

    function setLiabilities(uint _liabilities) onlyRegionToken returns (bool success) {
        liabilities = _liabilities;
        return true;
    }

    function setActive(bool _active) onlyParticipant returns (bool success) {
        active = _active;
        return true;
    }

    function setMaster(address _addr) onlyParticipant returns (bool success) {
        master = _addr;
        return true;
    }

    function setMaxLiabilities(uint _maxLiabilities) onlyParticipant returns (bool success) {
        maxLiabilities = _maxLiabilities;
        return true;
    }

    function setTerminal(address _addr, bool _active) onlyParticipant returns (bool success) {
        terminals[_addr] = _active;
        return true;
    }
}
