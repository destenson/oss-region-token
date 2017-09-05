var LOCAL_STORAGE = {};
var _prefix = 'region-token.v2.';

var _tokenAddressKey = _prefix + 'token-address';
var _creatorAccountKey = _prefix + 'creator';
var _storeMasterAccountsKey = _prefix + 'store-masters';
var _terminalAccountsKey = _prefix + 'terminals';
var _usersAccountKey = _prefix + 'users';
var _storeStatusKey = _prefix + 'store-status';

LOCAL_STORAGE.getTokenAddress = function() {
    return localStorage.getItem(_tokenAddressKey);
};
LOCAL_STORAGE.setTokenAddress = function(_tokenAddress) {
    localStorage.setItem(_tokenAddressKey, _tokenAddress);
};

LOCAL_STORAGE.getCreatorAccount = function() {
    var serialized = localStorage.getItem(_creatorAccountKey);
    return serialized ? ethClient.Account.deserialize(serialized) : null;
};
LOCAL_STORAGE.setCreatorAccount = function(_account) {
    localStorage.setItem(_creatorAccountKey, _account.serialize());
};

LOCAL_STORAGE.getStoreMasterAccount = function(_storeKey) {
    var _storeKey = _storeKey.toString();
    var serialized = localStorage.getItem(_storeMasterAccountsKey);
    return serialized ? ethClient.Account.deserialize(JSON.parse(serialized)[_storeKey]) : null;
};
LOCAL_STORAGE.putStoreMasterAccount = function(_storeKey, _account) {
    var _storeKey = _storeKey.toString();
    var serialized = localStorage.getItem(_storeMasterAccountsKey);
    var accounts = serialized ? JSON.parse(serialized) : {};
    accounts[_storeKey] = _account.serialize();
    localStorage.setItem(_storeMasterAccountsKey, JSON.stringify(accounts));
};

LOCAL_STORAGE.getTerminalAccountSize = function(_storeKey) {
    var _storeKey = _storeKey.toString();
    var serialized = localStorage.getItem(_terminalAccountsKey);
    var accounts = serialized ? JSON.parse(serialized) : {};
    var terminals = accounts[_storeKey] ? accounts[_storeKey] : [];
    return terminals.length;
};
LOCAL_STORAGE.getTerminalAccountByAddress = function(_storeKey, _addr) {
    var _storeKey = _storeKey.toString();
    var terminalSize = LOCAL_STORAGE.getTerminalAccountSize(_storeKey);
    for (var i = 0; i < terminalSize; i++) {
        var account = LOCAL_STORAGE.getTerminalAccount(_storeKey, i);
        if (_addr == account.getAddress()) {
            return account;
        }
    }
    return null;
};
LOCAL_STORAGE.getTerminalAccount = function(_storeKey, _idx) {
    var _storeKey = _storeKey.toString();
    var serialized = localStorage.getItem(_terminalAccountsKey);
    var accounts = serialized ? JSON.parse(serialized) : {};
    var terminals = accounts[_storeKey] ? accounts[_storeKey] : [];
    return _idx < terminals.length ? ethClient.Account.deserialize(terminals[_idx]) : null;
};
LOCAL_STORAGE.addTerminalAccount = function(_storeKey, _account) {
    var _storeKey = _storeKey.toString();
    var serialized = localStorage.getItem(_terminalAccountsKey);
    var accounts = serialized ? JSON.parse(serialized) : {};
    var terminals = accounts[_storeKey] ? accounts[_storeKey] : [];
    terminals.push(_account.serialize());
    accounts[_storeKey] = terminals;
    localStorage.setItem(_terminalAccountsKey, JSON.stringify(accounts));
};
LOCAL_STORAGE.removeTerminalAccount = function(_storeKey, _removed) {
    var _storeKey = _storeKey.toString();
    var serialized = localStorage.getItem(_terminalAccountsKey);
    var accounts = serialized ? JSON.parse(serialized) : {};
    var terminals = accounts[_storeKey].filter(function(account) {
        return ethClient.Account.deserialize(account).getAddress() !== _removed;
    });
    accounts[_storeKey] = terminals;
    localStorage.setItem(_terminalAccountsKey, JSON.stringify(accounts));
}
LOCAL_STORAGE.getUserAccountSize = function() {
    var serializeds = localStorage.getItem(_usersAccountKey);
    return serializeds ? JSON.parse(serializeds).length : 0;
};
LOCAL_STORAGE.getUserAccountByAddress = function(_addr) {
    var accountSize = LOCAL_STORAGE.getUserAccountSize();
    for (var i = 0; i < accountSize; i++) {
        var account = LOCAL_STORAGE.getUserAccount(i);
        if (_addr == account.getAddress()) {
            return account;
        }
    }
    return null;
};
LOCAL_STORAGE.getUserAccount = function(_idx) {
    var serializeds = localStorage.getItem(_usersAccountKey);
    return serializeds ? ethClient.Account.deserialize(JSON.parse(serializeds)[_idx]) : null;
};
LOCAL_STORAGE.addUserAccount = function(_account) {
    var serializeds = localStorage.getItem(_usersAccountKey);
    var accounts = serializeds ? JSON.parse(serializeds) : [];
    accounts.push(_account.serialize());
    localStorage.setItem(_usersAccountKey, JSON.stringify(accounts));
};

LOCAL_STORAGE.getStoreStatusSize = function() {
    var serialized = localStorage.getItem(_storeStatusKey);
    return serialized ? JSON.parse(serialized).length : 0;
};
LOCAL_STORAGE.getStoreStatus = function(_idx) {
    var serialized = localStorage.getItem(_storeStatusKey);
    return serialized ? JSON.parse(serialized)[_idx] : null;
};
LOCAL_STORAGE.addStoreStatus = function(_storeKey, _name) {
    var _storeKey = _storeKey.toString();
    var serialized = localStorage.getItem(_storeStatusKey);
    var accounts = serialized ? JSON.parse(serialized) : [];
    accounts.push({ key: _storeKey, name: _name });
    localStorage.setItem(_storeStatusKey, JSON.stringify(accounts));
};