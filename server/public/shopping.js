$(document).ready(function() {

    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    if (!tokenAddress) {
        DEMO_UTIL.confirmDialog(
            demoMsg('common.dialog.err-no-token-account-env.title'),
            demoMsg('common.dialog.err-no-token-account-env.msg'),
            function() {
                window.location.href = './create.html';
            },
            function() {
                window.location.href = './index.html';
            }
        );
        return;
    }

    var accountSize = LOCAL_STORAGE.getUserAccountSize();
    if (accountSize == 0) {
        DEMO_UTIL.confirmDialog(
            demoMsg('shopping.dialog.err-no-user-account.title'),
            demoMsg('shopping.dialog.err-no-user-account.msg'),
            function() {
                $(this).dialog("close");
                DEMO_UTIL.startLoad();
                ETH_UTIL.generateNewAccount(function(_newAccount1) {
                    ETH_UTIL.generateNewAccount(function(_newAccount2) {
                        ETH_UTIL.generateNewAccount(function(_newAccount3) {
                            LOCAL_STORAGE.addUserAccount(_newAccount1);
                            LOCAL_STORAGE.addUserAccount(_newAccount2);
                            LOCAL_STORAGE.addUserAccount(_newAccount3);
                            DEMO_UTIL.stopLoad();
                            refreshPage();
                        });
                    });
                });
            },
            function() {
                window.location.href = './index.html';
            }
        );
        return;
    }
    refreshPage();
});

var refreshPage = function() {
    var endUser = $('#end-user');
    endUser.empty();
    endUser.append($('<option>').val("").text(demoMsg('common.content.select')));
    var userCount = LOCAL_STORAGE.getUserAccountSize();
    for (var i = 0; i < userCount; i++) {
        var userAccount = LOCAL_STORAGE.getUserAccount(i);
        endUser.append($('<option>').val(userAccount.getAddress()).text(userAccount.getAddress()));
    }

    var store = $('#store');
    store.empty();
    store.append($('<option>').val("").text(demoMsg('common.content.select')));
    var storeCount = LOCAL_STORAGE.getStoreStatusSize();
    for (var i = 0; i < storeCount; i++) {
        var storeStatus = LOCAL_STORAGE.getStoreStatus(i);
        store.append($('<option>').val(storeStatus.key).text(storeStatus.name));
    }
};

var refreshUser = function(callback) {
    $('#end-user-address').empty();
    $('#end-user-address').append("&nbsp;");
    $('#end-user-balance').empty();
    $('#end-user-balance').append("&nbsp;");
    $('#end-user-balance-input').val("");
    var addr = $('#end-user').val();
    if (addr == '') {
        $('#store-area').css('display', 'none');
    } else {
        $('#store-area').css('display', 'block');
        $('#end-user-address').html(addr);
        var endUserAccount = LOCAL_STORAGE.getUserAccountByAddress(addr);
        var tokenAddress = LOCAL_STORAGE.getTokenAddress();
        var contract = ETH_UTIL.getContract(endUserAccount);
        contract.call('', 'ProxyController', 'getBalance', [tokenAddress, endUserAccount.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
            if (err) {
                console.error(err);
                alert('error');
                return;
            }
            console.log(res);
            var balance = res[0].toString(10);
            if (callback) {
                callback(balance);
            } else {
                $('#end-user-balance-input').val(balance);
                $('#end-user-balance').html(balance);
            }
        });
    }
};

var MAX_RETRY = 3;
var RETRY_INTERVAL = 3000;
var refreshUserUntilReflected = function() {
    var addr = $('#end-user').val();
    var oldBalance = $('#end-user-balance-input').val();
    refreshUserWithRetry(0, oldBalance);
};
var refreshUserWithRetry = function(currenRetryCount, oldBalance) {
    refreshUser(function(balance) {
        if (currenRetryCount >= MAX_RETRY || oldBalance != balance) {
            $('#end-user-balance-input').val(balance);
            $('#end-user-balance').html(balance);
            return;
        }
        setTimeout(
            function() {
                currenRetryCount++;
                console.log('retry : ' + currenRetryCount);
                refreshUserWithRetry(currenRetryCount, oldBalance);
            }
        , RETRY_INTERVAL);
    });
};

var changeStore = function() {
    var termianl = $('#terminal');
    termianl.empty();
    termianl.append($('<option>').val("").text(demoMsg('common.content.select')));
    var storeKey = $('#store').val();
    if (storeKey == '') {
        return;
    }
    var terminalCount = LOCAL_STORAGE.getTerminalAccountSize(storeKey);
    for (var i = 0; i < terminalCount; i++) {
        var terminalAccount = LOCAL_STORAGE.getTerminalAccount(storeKey, i);
        termianl.append($('<option>').val(terminalAccount.getAddress()).text(terminalAccount.getAddress()));
    }
};

var assighToken = function() {
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;

    var terminal = $('#terminal').val();
    var amount = $('#get-token-amount').val().trim();

    // validate(very simple for DEMO)
    if (terminal == '') {
        DEMO_UTIL.okDialog(
            demoMsg('shopping.dialog.err-no-terminal.title'),
            demoMsg('shopping.dialog.err-no-terminal.msg')
        );
        return DEMO_UTIL.stopLoad();
    }
    if (!amount.match(/[1-9][0-9]{0,17}/)) {
        DEMO_UTIL.okDialog(
            demoMsg('shopping.dialog.err-no-get-amount.title'),
            demoMsg('shopping.dialog.err-no-get-amount.msg')
        );
        return DEMO_UTIL.stopLoad();
    }

    var terminalAccount = LOCAL_STORAGE.getTerminalAccountByAddress($('#store').val(), terminal);
    var contract = ETH_UTIL.getContract(terminalAccount);
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var toAddress = $('#end-user').val();
    var nonce, sign;
    contract.call('', 'ProxyController', 'getNonce', [tokenAddress, terminalAccount.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert('error');
            return;
        }
        console.log(res.toString(10));
        nonce = res.toString(10);
        terminalAccount.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'address', 'uint', 'uint'], [tokenAddress, 'transferWithSign', toAddress, amount, nonce]), function(err, res) {
            if (err) {
                console.error(err);
                alert('error');
                return;
            }
            console.log(res);
            sign = res;
            contract.sendTransaction('', 'ProxyController', 'transfer', [tokenAddress, toAddress, amount, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                if (err) {
                    console.error(err);
                    getStoreStatus(function(status) {
                        if (!status) {
                            DEMO_UTIL.okDialog(
                                demoMsg('common.dialog.err-no-store-active.title'),
                                demoMsg('common.dialog.err-no-store-active.msg')
                            );
                            DEMO_UTIL.stopLoad();
                            return;
                        }
                        getStoreLastLiabilities(function(lastLiabilities) {
                            if (new BigNumber(amount).gt(lastLiabilities)) {
                                DEMO_UTIL.okDialog(
                                    demoMsg('shopping.dialog.err-no-store-balance.title'),
                                    demoMsg('shopping.dialog.err-no-store-balance.msg')
                                );
                                DEMO_UTIL.stopLoad();
                                return;
                            }
                            DEMO_UTIL.stopLoad();
                            alert('error');
                        });
                    });
                    return;
                }
                console.log(res);
                $('#get-token-amount').val(amount);
                refreshUserUntilReflected();
                DEMO_UTIL.stopLoad();
            });
        });
    });
};

var consumeToken = function() {
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;

    var terminal = $('#terminal').val();
    var amount = $('#use-token-amount').val().trim();

    // validate(very simple for DEMO)
    if (terminal == '') {
        DEMO_UTIL.okDialog(
            demoMsg('shopping.dialog.err-no-terminal.title'),
            demoMsg('shopping.dialog.err-no-terminal.msg')
        );
        return DEMO_UTIL.stopLoad();
    }
    if (!amount.match(/[1-9][0-9]{0,17}/)) {
        DEMO_UTIL.okDialog(
            demoMsg('shopping.dialog.err-no-use-amount.title'),
            demoMsg('shopping.dialog.err-no-use-amount.msg')
        );
        return DEMO_UTIL.stopLoad();
    }

    var userAccount = LOCAL_STORAGE.getUserAccountByAddress($('#end-user').val(), terminal);
    var contract = ETH_UTIL.getContract(userAccount);
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var nonce, sign;
    contract.call('', 'ProxyController', 'getNonce', [tokenAddress, userAccount.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert('error');
            return;
        }
        console.log(res.toString(10));
        nonce = res.toString(10);
        userAccount.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'address', 'uint', 'uint'], [tokenAddress, 'transferWithSign', terminal, amount, nonce]), function(err, res) {
            if (err) {
                console.error(err);
                alert('error');
                return;
            }
            console.log(res);
            sign = res;
            contract.sendTransaction('', 'ProxyController', 'transfer', [tokenAddress, terminal, amount, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                if (err) {
                    console.error(err);
                    // check error reason
                    getStoreStatus(function(status) {
                        if (!status) {
                            DEMO_UTIL.okDialog(
                                demoMsg('common.dialog.err-no-store-active.title'),
                                demoMsg('common.dialog.err-no-store-active.msg')
                            );
                            DEMO_UTIL.stopLoad();
                            return;
                        }
                        getEndUserBalance(function(balance) {
                            if (new BigNumber(amount).gt(balance)) {
                                DEMO_UTIL.okDialog(
                                    demoMsg('shopping.dialog.err-no-user-balance.title'),
                                    demoMsg('shopping.dialog.err-no-user-balance.msg')
                                );
                                DEMO_UTIL.stopLoad();
                                return;
                            }
                            DEMO_UTIL.stopLoad();
                            alert('error');
                        });
                    });
                    return;
                }
                console.log(res);
                $('#use-token-amount').val('');
                refreshUserUntilReflected();
                DEMO_UTIL.stopLoad();
            });
        });
    });
};

var getStoreStatus = function (callback) {
    var addr = $('#end-user').val();
    var endUserAccount = LOCAL_STORAGE.getUserAccountByAddress(addr);
    var storeKey = $('#store').val();
    var contract = ETH_UTIL.getContract(endUserAccount);
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var storeAddress, balance, maxLiabilities, active;
    contract.call('', 'ProxyController', 'getStoreInfo', [tokenAddress, storeKey], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert('error');
            return;
        }
        console.log(res);
        callback(res[3]);
    });
};

var getEndUserBalance = function (callback) {
    var addr = $('#end-user').val();
    var endUserAccount = LOCAL_STORAGE.getUserAccountByAddress(addr);
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var contract = ETH_UTIL.getContract(endUserAccount);
    contract.call('', 'ProxyController', 'getBalance', [tokenAddress, endUserAccount.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert('error');
            return;
        }
        console.log(res);
        callback(res[0]);
    });
};

var getStoreLastLiabilities = function (callback) {
    var addr = $('#end-user').val();
    var endUserAccount = LOCAL_STORAGE.getUserAccountByAddress(addr);
    var storeKey = $('#store').val();
    var contract = ETH_UTIL.getContract(endUserAccount);
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var storeAddress, balance, maxLiabilities, active;
    contract.call('', 'ProxyController', 'getStoreInfo', [tokenAddress, storeKey], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert('error');
            return;
        }
        console.log(res);
        callback(res[2].minus(res[1].plus(res[0])));
    });
};
