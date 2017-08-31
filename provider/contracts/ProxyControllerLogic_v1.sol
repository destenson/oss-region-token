pragma solidity ^0.4.8;

import '../../gmo/contracts/VersionLogic.sol';
import './ProxyController.sol';
import './RegionToken.sol';
import './Participant.sol';

contract ProxyControllerLogic_v1 is VersionLogic, ProxyController {
    function ProxyControllerLogic_v1(ContractNameService _cns) VersionLogic (_cns, CONTRACT_NAME) {}

    function getSymbol(address _tokenAddress) constant returns (bytes32 symbol) {
        return RegionToken(_tokenAddress).symbol();
    }

    function getName(address _tokenAddress) constant returns (bytes32 name) {
        return RegionToken(_tokenAddress).name();
    }

    function getTotalSupply(address _tokenAddress) constant returns (uint totalSupply) {
        return RegionToken(_tokenAddress).totalSupply();
    }

    function getNonce(address _tokenAddress, address _addr) constant returns (uint nonce) {
        return RegionToken(_tokenAddress).nonceOf(_addr);
    }

    function getBalance(address _tokenAddress, address _addr) constant returns (uint balance) {
        return RegionToken(_tokenAddress).balanceOf(_addr);
    }

    function getAllowance(address _tokenAddress, address _holder, address _spender) constant returns (uint balance) {
        return RegionToken(_tokenAddress).allowance(_holder, _spender);
    }

    function approve(address _tokenAddress, address _spender, uint _amount, uint _nonce, bytes _sign) {
        assert(RegionToken(_tokenAddress).approveWithSign(_spender, _amount, _nonce, _sign));
    }

    function transfer(address _tokenAddress, address _to, uint _amount, uint _nonce, bytes _sign) {
        assert(RegionToken(_tokenAddress).transferWithSign(_to, _amount, _nonce, _sign));
    }


    function getParticipant(address _tokenAddress) constant returns (Participant) {
        return (RegionToken(_tokenAddress).participant());
    }

    function getParticipantNonce(address _tokenAddress, address _addr) constant returns (uint nonce) {
        return getParticipant(_tokenAddress).nonceOf(_addr);
    }

    function addStore(address _tokenAddress, bytes32 _storeKey, bytes32 _name, address _storeMasterAddress, uint _maxLiabilities, uint _nonce, bytes _sign) {
        assert(getParticipant(_tokenAddress).addStoreWithSign(_storeKey, _name, _storeMasterAddress, _maxLiabilities, _nonce, _sign));
    }

    function activateStore(address _tokenAddress, bytes32 _storeKey, uint _nonce, bytes _sign) {
        assert(getParticipant(_tokenAddress).activateStoreWithSign(_storeKey, _nonce, _sign));
    }

    function inactivateStore(address _tokenAddress, bytes32 _storeKey, uint _nonce, bytes _sign) {
        assert(getParticipant(_tokenAddress).inactivateStoreWithSign(_storeKey, _nonce, _sign));
    }

    function addTerminal(address _tokenAddress, bytes32 _storeKey, address _terminal, uint _nonce, bytes _sign) {
        assert(getParticipant(_tokenAddress).addTerminalWithSign(_storeKey, _terminal, _nonce, _sign));
    }

    function removeTerminal(address _tokenAddress, bytes32 _storeKey, address _terminal, uint _nonce, bytes _sign) {
        assert(getParticipant(_tokenAddress).removeTerminalWithSign(_storeKey, _terminal, _nonce, _sign));
    }

    function setStoreMaxLiabilities(address _tokenAddress, bytes32 _storeKey, uint _maxLiabilities, uint _nonce, bytes _sign) {
        assert(getParticipant(_tokenAddress).setStoreMaxLiabilitiesWithSign(_storeKey, _maxLiabilities, _nonce, _sign));
    }

    function isStoreMaster(address _tokenAddress, address _addr) constant returns (bool) {
        return getParticipant(_tokenAddress).isStoreMaster(_addr);
    }

    function isTerminal(address _tokenAddress, address _addr) constant returns (bool) {
        return getParticipant(_tokenAddress).isTerminal(_addr);
    }

    function isActiveStore(address _tokenAddress, bytes32 _storeKey) constant returns (bool) {
        return getParticipant(_tokenAddress).isActiveStore(_storeKey);
    }

    function getStoreAddress(address _tokenAddress, bytes32 _storeKey) constant returns (address) {
        return getParticipant(_tokenAddress).stores(_storeKey);
    }

    function getStoreName(address _tokenAddress, bytes32 _storeKey) constant returns (bytes32) {
        return getParticipant(_tokenAddress).getStoreName(_storeKey);
    }

    function getStoreMaxLiabilities(address _tokenAddress, bytes32 _storeKey) constant returns (uint) {
        return getParticipant(_tokenAddress).getStoreMaxLiabilities(_storeKey);
    }

    function getStoreCurrentMinus(address _tokenAddress, bytes32 _storeKey) constant returns (uint) {
        return getParticipant(_tokenAddress).getStoreCurrentMinus(_storeKey);
    }

    function getStoreMaster(address _tokenAddress, bytes32 _storeKey) constant returns (address) {
        return getParticipant(_tokenAddress).getStoreMaster(_storeKey);
    }

    function getStoreInfo(address _tokenAddress, bytes32 _storeKey) constant returns (uint balance, uint liabilities, uint maxLiabilities, bool active) {
        address storeAddress = getParticipant(_tokenAddress).stores(_storeKey);
        balance = getBalance(_tokenAddress, storeAddress);
        liabilities = getStoreCurrentMinus(_tokenAddress, _storeKey);
        maxLiabilities = getStoreMaxLiabilities(_tokenAddress, _storeKey);
        active = isActiveStore(_tokenAddress, _storeKey);
    }
}
