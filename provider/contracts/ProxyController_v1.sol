pragma solidity ^0.4.8;

import '../../gmo/contracts/VersionContract.sol';
import './ProxyController.sol';
import './ProxyControllerLogic_v1.sol';

contract ProxyController_v1 is VersionContract, ProxyController {
    ProxyControllerLogic_v1 public logic_v1;

    function ProxyController_v1(ContractNameService _cns, ProxyControllerLogic_v1 _logic_v1) VersionContract(_cns, CONTRACT_NAME) {
        logic_v1 = _logic_v1;
    }

    function getSymbol(address _tokenAddress) constant returns (bytes32 symbol) {
        return logic_v1.getSymbol(_tokenAddress);
    }

    function getName(address _tokenAddress) constant returns (bytes32 name) {
        return logic_v1.getName(_tokenAddress);
    }

    function getTotalSupply(address _tokenAddress) constant returns (uint totalSupply) {
        return logic_v1.getTotalSupply(_tokenAddress);
    }

    function getNonce(address _tokenAddress, address _addr) constant returns (uint nonce) {
        return logic_v1.getNonce(_tokenAddress, _addr);
    }

    function getBalance(address _tokenAddress, address _addr) constant returns (uint balance) {
        return logic_v1.getBalance(_tokenAddress, _addr);
    }

    function getAllowance(address _tokenAddress, address _holder, address _spender) constant returns (uint balance) {
        return logic_v1.getAllowance(_tokenAddress, _holder, _spender);
    }

    function approve(bytes _sign, address _tokenAddress, address _spender, uint _amount, uint _nonce, bytes _clientSign) {
        logic_v1.approve(_tokenAddress, _spender, _amount, _nonce, _clientSign);
    }

    function transfer(bytes _sign, address _tokenAddress, address _to, uint _amount, uint _nonce, bytes _clientSign) {
        logic_v1.transfer(_tokenAddress, _to, _amount, _nonce, _clientSign);
    }


    function getParticipantNonce(address _tokenAddress, address _addr) constant returns (uint nonce) {
        return logic_v1.getParticipantNonce(_tokenAddress, _addr);
    }

    function addStore(bytes _sign, address _tokenAddress, bytes32 _storeKey, bytes32 _name, address _storeMasterAddress, uint _maxLiabilities, uint _nonce, bytes _clientSign) {
        logic_v1.addStore(_tokenAddress, _storeKey, _name, _storeMasterAddress, _maxLiabilities, _nonce, _clientSign);
    }

    function activateStore(bytes _sign, address _tokenAddress, bytes32 _storeKey, uint _nonce, bytes _clientSign) {
        logic_v1.activateStore(_tokenAddress, _storeKey, _nonce, _clientSign);
    }

    function inactivateStore(bytes _sign, address _tokenAddress, bytes32 _storeKey, uint _nonce, bytes _clientSign) {
        logic_v1.inactivateStore(_tokenAddress, _storeKey, _nonce, _clientSign);
    }

    function addTerminal(bytes _sign, address _tokenAddress, bytes32 _storeKey, address _terminal, uint _nonce, bytes _clientSign) {
        logic_v1.addTerminal(_tokenAddress, _storeKey, _terminal, _nonce, _clientSign);
    }

    function removeTerminal(bytes _sign, address _tokenAddress, bytes32 _storeKey, address _terminal, uint _nonce, bytes _clientSign) {
        logic_v1.removeTerminal(_tokenAddress, _storeKey, _terminal, _nonce, _clientSign);
    }

    function setStoreMaxLiabilities(bytes _sign, address _tokenAddress, bytes32 _storeKey, uint _maxLiabilities, uint _nonce, bytes _clientSign) {
        logic_v1.setStoreMaxLiabilities(_tokenAddress, _storeKey, _maxLiabilities, _nonce, _clientSign);
    }

   function isStoreMaster(address _tokenAddress, address _addr) constant returns (bool) {
        return logic_v1.isStoreMaster(_tokenAddress, _addr);
    }

    function isTerminal(address _tokenAddress, address _addr) constant returns (bool) {
        return logic_v1.isTerminal(_tokenAddress, _addr);
    }

    function isActiveStore(address _tokenAddress, bytes32 _storeKey) constant returns (bool) {
        return logic_v1.isActiveStore(_tokenAddress, _storeKey);
    }

    function getStoreAddress(address _tokenAddress, bytes32 _storeKey) constant returns (address) {
        return logic_v1.getStoreAddress(_tokenAddress, _storeKey);
    }

    function getStoreName(address _tokenAddress, bytes32 _storeKey) constant returns (bytes32) {
        return logic_v1.getStoreName(_tokenAddress, _storeKey);
    }

    function getStoreMaxLiabilities(address _tokenAddress, bytes32 _storeKey) constant returns (uint) {
        return logic_v1.getStoreMaxLiabilities(_tokenAddress, _storeKey);
    }

    function getStoreCurrentMinus(address _tokenAddress, bytes32 _storeKey) constant returns (uint) {
        return logic_v1.getStoreCurrentMinus(_tokenAddress, _storeKey);
    }

    function getStoreMaster(address _tokenAddress, bytes32 _storeKey) constant returns (address) {
        return logic_v1.getStoreMaster(_tokenAddress, _storeKey);
    }

    function getStoreInfo(address _tokenAddress, bytes32 _storeKey) constant returns (uint balance, uint liabilities, uint maxLiabilities, bool active) {
        return logic_v1.getStoreInfo(_tokenAddress, _storeKey);
    }
}
