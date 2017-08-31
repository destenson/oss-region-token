pragma solidity ^0.4.8;

import './TokenInterface.sol';
import './Participant.sol';
import './Store.sol';

contract RegionToken is TokenInterface {
    uint8 public constant decimals = 18;

    bytes32 public symbol;
    bytes32 public name;
    uint public totalSupply;

    // Participant
    Participant public participant;

    // nonce for each account
    mapping(address => uint) nonces;

    // Balances for each account
    mapping(address => uint) balances;

    // Owner of account approves the transfer of an amount to another account
    mapping(address => mapping(address => uint)) allowed;

    // Constructor
    function RegionToken(address _owner, bytes32 _symbol, bytes32 _name) {
        participant = new Participant(_owner);
        symbol = _symbol;
        name = _name;
    }

    function totalSupply() constant returns (uint) {
        return totalSupply;
    }

    // What is the nonce of a particular account?
    function nonceOf(address _holder) constant returns (uint) {
        return nonces[_holder];
    }

    // What is the balance of a particular account?
    function balanceOf(address _holder) constant returns (uint) {
        return balances[_holder];
    }

    // Transfer the balance from holder's account to another account
    function transfer(address _to, uint _amount) returns (bool success) {
        return transferParticipantInternal(msg.sender, _to, _amount);
    }

    // Send _value amount of tokens from address _from to address _to
    // The transferFrom method is used for a withdraw workflow, allowing contracts to send
    // tokens on your behalf, for example to "deposit" to a contract address and/or to charge
    // fees in sub-currencies; the command should fail unless the _from account has
    // deliberately authorized the sender of the message via some mechanism; we propose
    // these standardized APIs for approval:
    function transferFrom(address _from, address _to, uint _amount) returns (bool success) {
        if (allowed[_from][msg.sender] >= _amount && transferInternal(_from, _to, _amount)) {
            allowed[_from][msg.sender] -= _amount;
            return true;
        }
        return false;
    }

    function transferWithSign(address _to, uint _amount, uint _nonce, bytes _sign) returns (bool success) {
        bytes32 hash = calcEnvHash('transferWithSign');
        hash = sha3(hash, _to);
        hash = sha3(hash, _amount);
        hash = sha3(hash, _nonce);
        address from = recoverAddress(hash, _sign);

        if (_nonce == nonces[from] && transferParticipantInternal(from, _to, _amount)) {
            nonces[from]++;
            return true;
        }
        return false;
    }

    function transferInternal(address _from, address _to, uint _amount) private returns (bool success) {
        if (balances[_from] >= _amount && _amount > 0 && balances[_to] + _amount > balances[_to]) {
            Transfer(_from, _to, _amount);
            balances[_from] -= _amount;
            balances[_to] += _amount;
            return true;
        }
        return false;
    }

    // Case classification by condition
    function transferParticipantInternal(address _from, address _to, uint _amount) private returns (bool success) {
        if (participant.isOwner(_from) && participant.storeAddresses(_to)) return transferFromOwnerToStore(_from, _to, _amount);
        else if (participant.isStoreMaster(_from) && participant.isOwner(_to)) return transferFromStoreMasterToOwner(_from, _to, _amount);
        else if (participant.isTerminal(_from) && (!participant.isOwner(_to) && !participant.storeAddresses(_to) && !participant.isTerminal(_to))) return transferFromTerminalToUser(_from, _to, _amount);
        else if (participant.isTerminal(_to)) return transferFromUserToTerminal(_from, _to, _amount);
        return false;
    }

    // store master(Actually, store master's store) -> token holder
    function transferFromOwnerToStore(address _from, address _to, uint _amount) private returns (bool success) {
        Store store = Store(_to);
        if (_amount <= 0) return false;

        if (store.liabilities() >= _amount) {
            Transfer(_from, _to, _amount);
            return store.reduceLiabilities(_amount);
        }

        uint remainder = _amount - store.liabilities();
        if (remainder > 0 && balances[_to] + remainder > balances[_to] && totalSupply + remainder > totalSupply) {
            Transfer(_from, _to, _amount);
            totalSupply += remainder;
            balances[_to] += remainder;
            return store.setLiabilities(0);
        }
        return false;
    }

    // token owner -> store (no check store.active or not)
    // no check store activation
    function transferFromStoreMasterToOwner(address _from, address _to, uint _amount) private returns (bool success) {
        Store store = Store(participant.storeMasterAddresses(_from));
        if (store.master() == _from && balances[store] >= _amount && _amount > 0 && totalSupply >= _amount) {
            Transfer(store, _to, _amount);
            balances[store] -= _amount;
            totalSupply -= _amount;
            return true;
        }
        return false;
    }

    // terminal(Actually, terminal's store) -> user
    function transferFromTerminalToUser(address _from, address _to, uint _amount) private returns (bool success) {
        Store store = Store(participant.terminalAddresses(_from));
        if (_amount <= 0 || !store.active() || !store.terminals(_from) || balances[_to] + _amount <= balances[_to]) return false;

        if (balances[store] >= _amount) {
            Transfer(store, _to, _amount);
            balances[store] -= _amount;
            balances[_to] += _amount;
            return true;
        }

        uint lack = _amount - balances[store];
        if (lack > 0 && store.liabilities() + lack > store.liabilities() && store.maxLiabilities() >= store.liabilities() + lack && totalSupply + lack > totalSupply) {
            Transfer(store, _to, _amount);
            totalSupply += lack;
            balances[store] = 0;
            balances[_to] += _amount;
            return store.increaseLiabilities(lack);
        }
        return false;
    }

    // user -> terminal(store)
    function transferFromUserToTerminal(address _from, address _to, uint _amount) private returns (bool success) {
        Store store = Store(participant.terminalAddresses(_to));
        if (_amount <= 0 || !store.active() || !store.terminals(_to) || balances[_from] < _amount) return false;

        if (store.liabilities() >= _amount) {
            if (totalSupply < _amount) return false;

            Transfer(_from, store, _amount);
            totalSupply -= _amount;
            balances[_from] -= _amount;
            return store.reduceLiabilities(_amount);
        }

        uint remainder = _amount - store.liabilities();
        if (remainder > 0 && balances[store] + remainder > balances[store] && totalSupply >= store.liabilities()) {
            Transfer(_from, store, _amount);
            totalSupply -= store.liabilities();
            balances[_from] -= _amount;
            balances[store] += remainder;
            return store.setLiabilities(0);
        }
        return false;
    }

    // Allow _spender to withdraw from your account, multiple times, up to the _value amount.
    // If this function is called again it overwrites the current allowance with _value.
    function approve(address _spender, uint _amount) returns (bool success) {
        return approveInternal(msg.sender, _spender, _amount);
    }

    function approveWithSign(address _spender, uint _amount, uint _nonce, bytes _sign) returns (bool success) {
        bytes32 hash = calcEnvHash('approveWithSign');
        hash = sha3(hash, _spender);
        hash = sha3(hash, _amount);
        hash = sha3(hash, _nonce);
        address from = recoverAddress(hash, _sign);

        if (_nonce == nonces[from] && approveInternal(from, _spender, _amount)) {
            nonces[from]++;
            return true;
        }
        return false;
    }

    function approveInternal(address _from, address _spender, uint _amount) private returns (bool success) {
        allowed[_from][_spender] = _amount;
        Approval(_from, _spender, _amount);
        return true;
    }

    function allowance(address _holder, address _spender) constant returns (uint remaining) {
        return allowed[_holder][_spender];
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
