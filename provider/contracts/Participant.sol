pragma solidity ^0.4.8;

import './Store.sol';
import './RegionToken.sol';

contract Participant {
    address public owner;
    RegionToken public token;

    mapping (bytes32 => address) public stores; // storeKey => storeAddress
    mapping (address => bool) public storeAddress; // storeAddress => createdFlag
    mapping (address => address) public storeMasterAddrStoreAddr; // storeMasterAddress => storeAddress
    mapping (address => address) public terminalAddrStoreAddr; // terminalAddress => storeAddress

    // nonce for each account
    mapping(address => uint) nonces;

    event StoreStatus(bytes32 indexed _storeKey, bool _create, bool _active, uint _maxLiabilities);
    event Terminal(bytes32 indexed _storeKey, address indexed _address, bool _active);

    /* ----------- initialize ----------------- */

    function Participant(address _owner) {
        owner = _owner;
    }

    function setToken() {
        // just one time ()
        assert(address(token) == 0);
        token = RegionToken(msg.sender);
    }

    /* ----------- methods ----------------- */

    // What is the nonce of a particular account?
    function nonceOf(address _addr) constant returns (uint) {
        return nonces[_addr];
    }

    /**
     * register store by owner key
     */
    function addStore(bytes32 _storeKey, bytes32 _name, address _storeMasterAddress, uint _maxLiabilities) returns (bool) {
        return addStoreInternal(msg.sender, _storeKey, _name, _storeMasterAddress, _maxLiabilities);
    }

    function addStoreWithSign(bytes32 _storeKey, bytes32 _name, address _storeMasterAddress, uint _maxLiabilities, uint _nonce, bytes _sign) returns (bool) {
        bytes32 hash = calcEnvHash('addStoreWithSign');
        hash = sha3(hash, _storeKey);
        hash = sha3(hash, _name);
        hash = sha3(hash, _storeMasterAddress);
        hash = sha3(hash, _maxLiabilities);
        hash = sha3(hash, _nonce);
        address from = recoverAddress(hash, _sign);

        if (_nonce != nonceOf(from)) return false;
        nonces[from]++;

        return addStoreInternal(from, _storeKey, _name, _storeMasterAddress, _maxLiabilities);
    }

    function addStoreInternal(address _from, bytes32 _storeKey, bytes32 _name, address _storeMasterAddress, uint _maxLiabilities) private returns (bool) {
        if (address(token) == 0 && !isOwner(_from) || existStore(_storeKey) || isStoreMaster(_storeMasterAddress) || token.balanceOf(_storeMasterAddress) > 0) return false;
        StoreStatus(_storeKey, true, true, _maxLiabilities);
        address store = new Store(token, _name, _storeMasterAddress, _maxLiabilities);
        stores[_storeKey] = store;
        storeAddress[store] = true;
        storeMasterAddrStoreAddr[_storeMasterAddress] = store;
        return true;
    }

    /**
     * activate store by owner key
     */
    function activateStore(bytes32 _storeKey) returns (bool) {
        return setActiveStoreInternal(msg.sender, _storeKey, true);
    }

    function activateStoreWithSign(bytes32 _storeKey, uint _nonce, bytes _sign) returns (bool) {
        bytes32 hash = calcEnvHash('activateStoreWithSign');
        hash = sha3(hash, _storeKey);
        hash = sha3(hash, _nonce);
        address from = recoverAddress(hash, _sign);

        if (_nonce != nonceOf(from)) return false;
        nonces[from]++;

        return setActiveStoreInternal(from, _storeKey, true);
    }

    /**
     * inactivate store by owner key
     */
    function inactivateStore(bytes32 _storeKey) returns (bool) {
        return setActiveStoreInternal(msg.sender, _storeKey, false);
    }

    function inactivateStoreWithSign(bytes32 _storeKey, uint _nonce, bytes _sign) returns (bool) {
        bytes32 hash = calcEnvHash('inactivateStoreWithSign');
        hash = sha3(hash, _storeKey);
        hash = sha3(hash, _nonce);
        address from = recoverAddress(hash, _sign);

        if (_nonce != nonceOf(from)) return false;
        nonces[from]++;

        return setActiveStoreInternal(from, _storeKey, false);
    }

    function setActiveStoreInternal(address _from, bytes32 _storeKey, bool _active) private returns (bool) {
        if (!isOwner(_from) || !existStore(_storeKey) || isActiveStore(_storeKey) == _active) return false;
        StoreStatus(_storeKey, false, _active, Store(stores[_storeKey]).maxLiabilities());
        return Store(stores[_storeKey]).setActive(_active);
    }

    /**
     * register terminal by store master key
     */
    function addTerminal(bytes32 _storeKey, address _terminal) returns (bool) {
        return addTerminalInternal(msg.sender, _storeKey, _terminal);
    }

    function addTerminalWithSign(bytes32 _storeKey, address _terminal, uint _nonce, bytes _sign) returns (bool) {
        bytes32 hash = calcEnvHash('addTerminalWithSign');
        hash = sha3(hash, _storeKey);
        hash = sha3(hash, _terminal);
        hash = sha3(hash, _nonce);
        address from = recoverAddress(hash, _sign);

        if (_nonce != nonceOf(from)) return false;
        nonces[from]++;

        return addTerminalInternal(from, _storeKey, _terminal);
    }


    function addTerminalInternal(address _from, bytes32 _storeKey, address _terminal) private returns (bool) {
        if (!ownStoreMaster(_storeKey, _from) || isTerminal(_terminal) || !isActiveStore(_storeKey) || token.balanceOf(_terminal) > 0) return false;
        Terminal(_storeKey, _terminal, true);
        terminalAddrStoreAddr[_terminal] = stores[_storeKey];
        return Store(stores[_storeKey]).setTerminal(_terminal, true);
    }

    /**
     * remove terminal by store master key
     */
    function removeTerminal(bytes32 _storeKey, address _terminal) returns (bool) {
        return removeTerminalInternal(msg.sender, _storeKey, _terminal);
    }

    function removeTerminalWithSign(bytes32 _storeKey, address _terminal, uint _nonce, bytes _sign) returns (bool) {
        bytes32 hash = calcEnvHash('removeTerminalWithSign');
        hash = sha3(hash, _storeKey);
        hash = sha3(hash, _terminal);
        hash = sha3(hash, _nonce);
        address from = recoverAddress(hash, _sign);

        if (_nonce != nonceOf(from)) return false;
        nonces[from]++;

        return removeTerminalInternal(from, _storeKey, _terminal);
    }

    function removeTerminalInternal(address _from, bytes32 _storeKey, address _terminal) internal returns (bool) {
        if (!ownStoreMaster(_storeKey, _from) || !ownTerminal(_storeKey, _terminal) || !isActiveStore(_storeKey)) return false;
        // not clear terminalStoreKey
        Terminal(_storeKey, _terminal, false);
        return Store(stores[_storeKey]).setTerminal(_terminal, false);
    }

     /**
     * set store's minus token limit by owner
     */
    function setStoreMaxLiabilities(bytes32 _storeKey, uint _maxLiabilities) returns (bool) {
        return setMaxLiabilitiesInternal(msg.sender, _storeKey, _maxLiabilities);
    }

    function setStoreMaxLiabilitiesWithSign(bytes32 _storeKey, uint _maxLiabilities, uint _nonce, bytes _sign) returns (bool) {
        bytes32 hash = calcEnvHash('setStoreMaxLiabilitiesWithSign');
        hash = sha3(hash, _storeKey);
        hash = sha3(hash, _maxLiabilities);
        hash = sha3(hash, _nonce);
        address from = recoverAddress(hash, _sign);

        if (_nonce != nonceOf(from)) return false;
        nonces[from]++;

        return setMaxLiabilitiesInternal(from, _storeKey, _maxLiabilities);
    }

    function setMaxLiabilitiesInternal(address _from, bytes32 _storeKey, uint _maxLiabilities) private returns (bool) {
        if (!isOwner(_from) || !existStore(_storeKey)) return false;
        StoreStatus(_storeKey, false, true, _maxLiabilities);
        return Store(stores[_storeKey]).setMaxLiabilities(_maxLiabilities);
    }

    /* ----------- getters ----------------- */

    function isOwner(address _addr) constant returns (bool) {
        return owner == _addr;
    }

    function existStore(bytes32 _storeKey) constant returns (bool) {
        return stores[_storeKey] != 0;
    }

    function ownStoreMaster(bytes32 _storeKey, address _storeMaster) constant returns (bool) {
        return existStore(_storeKey) && Store(stores[_storeKey]).master() == _storeMaster;
    }

    function ownTerminal(bytes32 _storeKey, address _terminal) constant returns (bool) {
        return existStore(_storeKey) && Store(stores[_storeKey]).terminals(_terminal);
    }

    function isActiveStore(bytes32 _storeKey) constant returns (bool) {
        return existStore(_storeKey) && Store(stores[_storeKey]).active();
    }

   function isStore(address _addr) constant returns (bool) {
        return storeAddress[_addr];
    }

   function isStoreMaster(address _addr) constant returns (bool) {
        return storeMasterAddrStoreAddr[_addr] != 0;
    }

   function isTerminal(address _addr) constant returns (bool) {
        return terminalAddrStoreAddr[_addr] != 0;
    }

    function getStoreName(bytes32 _storeKey) constant returns (bytes32) {
        return Store(stores[_storeKey]).name();
    }

    function getStoreMaxLiabilities(bytes32 _storeKey) constant returns (uint) {
        return Store(stores[_storeKey]).maxLiabilities();
    }

    function getStoreCurrentMinus(bytes32 _storeKey) constant returns (uint) {
        return Store(stores[_storeKey]).liabilities();
    }

    function getStoreMaster(bytes32 _storeKey) constant returns (address) {
        return Store(stores[_storeKey]).master();
    }

    function calcEnvHash(bytes32 _functionName) constant returns (bytes32 hash) {
        hash = sha3(this);
        hash = sha3(hash, _functionName);
    }

    function recoverAddress(bytes32 _hash, bytes _sign) constant returns (address recoverdAddr) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        assert(_sign.length == 65);

        assembly {
            r := mload(add(_sign, 32))
            s := mload(add(_sign, 64))
            v := byte(0, mload(add(_sign, 96)))
        }

        if (v < 27) v += 27;
        assert(v == 27 || v == 28);

        recoverdAddr = ecrecover(_hash, v, r, s);
        assert(recoverdAddr != 0);
    }
}
