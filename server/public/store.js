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
    refreshPage();
});

var refreshPage = function() {
    $('#store-name').val('');
    $('#store-max-liabilities').val('');

    var storeSize = LOCAL_STORAGE.getStoreStatusSize();
    for (var i = 0; i < storeSize; i++) {
        var storeStatus = LOCAL_STORAGE.getStoreStatus(i);
        addStoreRow(storeStatus, true, 0);
    }
};

var addStoreRow = function(storeStatus, refreshStatus, maxLiabilities) {
    var key = storeStatus.key;
    var name = storeStatus.name;
    var storeRow = $('#store-row-template div:first').clone(true);
    storeRow.find('div[name="store-key"]').html(key);
    storeRow.find('input[name="store-key"]').val(key);
    storeRow.find('div[name="name"]').html(name);
    if (refreshStatus) {
        refreshStoreStatus(storeRow, key);
    } else {
        setStoreStatus(storeRow, 0, 0, maxLiabilities, true);
    }
    refreshStoreTerminal(storeRow, key)
    $('#store-list').append(storeRow);
};

var refreshStoreStatus = function(storeRow, key, callback) {

    var contract = ETH_UTIL.getContract(LOCAL_STORAGE.getCreatorAccount());
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var storeAddress, balance, maxLiabilities, active;
    contract.call('', 'ProxyController', 'getStoreInfo', [tokenAddress, key], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert('error');
            return;
        }
        console.log(res);
        var balance = res[0].toNumber(10);
        var liabilities = res[1].toNumber(10);
        var maxLiabilities = res[2].toNumber(10);
        var active = res[3];
        setStoreStatus(storeRow, balance, liabilities, maxLiabilities, active);
        if (callback) {
            callback(balance, liabilities, maxLiabilities, active);
        }
    });

};

var MAX_RETRY = 3;
var RETRY_INTERVAL = 3000;
var refreshStoreStatusUntilReflected = function(
        storeRow, key,
        changeBalance, changeMaxLiabilities, changeActive) {
    var oldBalance = storeRow.find('input[name="balance"]').val();
    var oldMaxLiabilities = storeRow.find('input[name="max-liabilities"]').val();
    var oldActive = storeRow.find('input[name="active"]').val();
    refreshStoreStatusWithRetry(
        storeRow, key, 0,
        changeBalance, changeMaxLiabilities, changeActive,
        oldBalance, oldMaxLiabilities, oldActive);
};
var refreshStoreStatusWithRetry = function(
    storeRow, key, currenRetryCount,
    changeBalance, changeMaxLiabilities, changeActive,
    oldBalance, oldMaxLiabilities, oldActive) {

    refreshStoreStatus(storeRow, key, function(balance, liabilities, maxLiabilities, active) {
        if (currenRetryCount >= MAX_RETRY) return;
        if (
            (!changeBalance || oldBalance != (balance - liabilities).toString()) &&
            (!changeMaxLiabilities || oldMaxLiabilities != maxLiabilities.toString()) &&
            (!changeActive || oldActive != active.toString())
            ) {
            return;
        }

        setTimeout(
            function() {
                currenRetryCount++;
                console.log('retry : ' + currenRetryCount);
                refreshStoreStatusWithRetry(
                    storeRow, key, currenRetryCount,
                    changeBalance, changeMaxLiabilities, changeActive,
                    oldBalance, oldMaxLiabilities, oldActive);
            }
        , RETRY_INTERVAL);
    });
};

var setStoreStatus = function(storeRow, balance, liabilities, maxLiabilities, active) {
        storeRow.find('div[name="balance"]').html(balance - liabilities);
        storeRow.find('input[name="balance"]').val(balance - liabilities);
        storeRow.find('div[name="max-liabilities"]').html(Number(maxLiabilities));
        storeRow.find('input[name="max-liabilities"]').val(Number(maxLiabilities));
        storeRow.find('div[name="active"]').html(active ? demoMsg('common.content.active') : demoMsg('common.content.inactive'));
        storeRow.find('input[name="active"]').val(active);
};

var refreshStoreTerminal = function(storeRow, key) {
    var terminals = storeRow.find('select[name="terminal"]');
    terminals.empty();
    terminals.append($('<option>').val("").text(demoMsg('common.content.select')));
    var terminalCount = LOCAL_STORAGE.getTerminalAccountSize(key);
    for (var i = 0; i < terminalCount; i++) {
        var terminalAccount = LOCAL_STORAGE.getTerminalAccount(key, i);
        terminals.append($('<option>').val(terminalAccount.getAddress()).text(terminalAccount.getAddress()));
    }
};


var liquidate = function(obj) {
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;
    var storeRow = $(obj.closest('div[name="store-row"]'));
    var key = storeRow.find('input[name="store-key"]').val();
    var balance = storeRow.find('input[name="balance"]').val();
    if (balance == 0) {
        DEMO_UTIL.okDialog(
            demoMsg('store.dialog.err-no-balance-to-liquidate.title'),
            demoMsg('store.dialog.err-no-balance-to-liquidate.msg')
        );
        DEMO_UTIL.stopLoad();
        return;

    } else if (balance > 0) {
        sendStoreToCreator(storeRow, key, balance);
    } else {
        sendCreatorToStore(storeRow, key, -balance);
    }
};

var sendStoreToCreator = function(storeRow, key, amount) {
    var storeMasterAccount = LOCAL_STORAGE.getStoreMasterAccount(key);
    var contract = ETH_UTIL.getContract(storeMasterAccount);
    var creatorAddress = LOCAL_STORAGE.getCreatorAccount().getAddress();
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var nonce, sign;
    contract.call('', 'ProxyController', 'getNonce', [tokenAddress, storeMasterAccount.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert('error');
            return;
        }
        console.log(res.toString(10));
        nonce = res.toString(10);
        storeMasterAccount.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'address', 'uint', 'uint'], [tokenAddress, 'transferWithSign', creatorAddress, amount, nonce]), function(err, res) {
            if (err) {
                console.error(err);
                alert('error');
                return;
            }
            console.log(res);
            sign = res;
            contract.sendTransaction('', 'ProxyController', 'transfer', [tokenAddress, creatorAddress, amount, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                if (err) {
                    console.error(err);
                    alert('error');
                    return;
                }
                console.log(res);
                refreshStoreStatusUntilReflected(storeRow, key, true, false, false);
                DEMO_UTIL.stopLoad()
            });
        });
    });
};

var sendCreatorToStore = function(storeRow, key, amount) {
    var creator = LOCAL_STORAGE.getCreatorAccount(key);
    var contract = ETH_UTIL.getContract(creator);
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var storeAddress, nonce, sign;
    contract.call('', 'ProxyController', 'getStoreAddress', [tokenAddress, key], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert('error');
            return;
        }
        console.log(res);
        storeAddress = res[0];
        contract.call('', 'ProxyController', 'getNonce', [tokenAddress, creator.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
            if (err) {
                console.error(err);
                alert('error');
                return;
            }
            console.log(res);
            nonce = res.toString(10);
            creator.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'address', 'uint', 'uint'], [tokenAddress, 'transferWithSign', storeAddress, amount, nonce]), function(err, res) {
                if (err) {
                    console.error(err);
                    alert('error');
                    return;
                }
                console.log(res);
                sign = res;
                contract.sendTransaction('', 'ProxyController', 'transfer', [tokenAddress, storeAddress, amount, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                    if (err) {
                        console.error(err);
                        alert('error');
                        return;
                    }
                    console.log(res);
                refreshStoreStatusUntilReflected(storeRow, key, true, false, false);
                    DEMO_UTIL.stopLoad();
                });
            });
        });
    });

};

var changeMaxLiabilities = function(obj) {
    if (DEMO_UTIL.isLoading()) return;
    var storeRow = $(obj.closest('div[name="store-row"]'));
    var key = storeRow.find('input[name="store-key"]').val();
    var maxLiabilities = storeRow.find('input[name="max-liabilities"]').val();

    DEMO_UTIL.inputDialog(
        demoMsg('common.caption.store.max-liabilities'),
        maxLiabilities,
        function() {
            var newMaxLiabilities = $('#dialog-input').val().trim();
            if (newMaxLiabilities == '') {
                DEMO_UTIL.okDialog(
                    demoMsg('common.dialog.err-required.title'),
                    demoMsg('common.dialog.err-required.msg')
                );
                return;
            }

            if (!newMaxLiabilities.match(/^[1-9][0-9]{0,17}$/)) {
                DEMO_UTIL.okDialog(
                    demoMsg('store.dialog.err-invalid-max-liabilities.title'),
                    demoMsg('store.dialog.err-invalid-max-liabilities.msg')
                );
                return;
            }

            // goto trade-trader.js
            $(this).dialog("close");
            if (!DEMO_UTIL.startLoad()) return;

            var creator = LOCAL_STORAGE.getCreatorAccount(key);
            var tokenAddress = LOCAL_STORAGE.getTokenAddress();
            var contract = ETH_UTIL.getContract(creator);
            var participantAddress, nonce, sign;
            contract.call('', 'ProxyController', 'getParticipantAndNonce', [tokenAddress, creator.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
                if (err) {
                    console.error(err);
                    alert('error');
                    return;
                }
                console.log(res);
                participantAddress = res[0];
                nonce = res[1].toString(10);
                creator.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'bytes32', 'uint', 'uint'], [participantAddress, 'setStoreMaxLiabilitiesWithSign', key, newMaxLiabilities, nonce]), function(err, res) {
                    if (err) {
                        console.error(err);
                        alert('error');
                        return;
                    }
                    console.log(res);
                    sign = res;
                    contract.sendTransaction('', 'ProxyController', 'setStoreMaxLiabilities', [tokenAddress, key, newMaxLiabilities, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                        if (err) {
                            console.error(err);
                            alert('error');
                            return;
                        }
                        console.log(res);
                refreshStoreStatusUntilReflected(storeRow, key, false, true, false);
                        DEMO_UTIL.stopLoad();
                    });
                });
            });
        }
    );
    return;
};

var changeActive = function(obj) {
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;
    var storeRow = $(obj.closest('div[name="store-row"]'));
    var key = storeRow.find('input[name="store-key"]').val();
    var active = storeRow.find('input[name="active"]').val();
    var creator = LOCAL_STORAGE.getCreatorAccount(key);
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var contract = ETH_UTIL.getContract(creator);
    var participantAddress, nonce, sign;
    contract.call('', 'ProxyController', 'getParticipantAndNonce', [tokenAddress, creator.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert('error');
            return;
        }
        console.log(res);
        participantAddress = res[0];
        nonce = res[1].toString(10);
        var functionName = active === 'true' ? 'inactivateStore' : 'activateStore';
        creator.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'bytes32', 'uint'], [participantAddress, functionName + 'WithSign', key, nonce]), function(err, res) {
            if (err) {
                console.error(err);
                alert('error');
                return;
            }
            console.log(res);
            sign = res;
            contract.sendTransaction('', 'ProxyController', functionName, [tokenAddress, key, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                if (err) {
                    console.error(err);
                    alert('error');
                    return;
                }
                console.log(res);
                refreshStoreStatusUntilReflected(storeRow, key, false, false, true);
                DEMO_UTIL.stopLoad();
            });
        });
    });
};

var removeTerminal = function(obj) {
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;
    var storeRow = $(obj.closest('div[name="store-row"]'));
    var key = storeRow.find('input[name="store-key"]').val();
    var terminal = storeRow.find('select[name="terminal"]').val();
    if (!terminal || terminal == "") {
        DEMO_UTIL.okDialog(
            demoMsg('store.dialog.err-no-terminal-selected.title'),
            demoMsg('store.dialog.err-no-terminal-selected.msg')
        );
        DEMO_UTIL.stopLoad();
        return;
    }

    var storeMasterAccount = LOCAL_STORAGE.getStoreMasterAccount(key);
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    var contract = ETH_UTIL.getContract(storeMasterAccount);
    var participantAddress, nonce, sign;
    contract.call('', 'ProxyController', 'getParticipantAndNonce', [tokenAddress, storeMasterAccount.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
        if (err) {
            console.error(err);
            alert('error');
            return;
        }
        console.log(res);
        participantAddress = res[0];
        nonce = res[1].toString(10);
        storeMasterAccount.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'bytes32', 'address', 'uint'], [participantAddress, 'removeTerminalWithSign', key, terminal, nonce]), function(err, res) {
            if (err) {
                console.error(err);
                alert('error');
                return;
            }
            console.log(res);
            sign = res;
            contract.sendTransaction('', 'ProxyController', 'removeTerminal', [tokenAddress, key, terminal, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                if (err) {
                    console.error(err);
                    getStoreStatus(key, function(status) {
                        DEMO_UTIL.stopLoad();
                        if (!status) {
                            DEMO_UTIL.okDialog(
                            demoMsg('common.dialog.err-no-store-active.title'),
                            demoMsg('common.dialog.err-no-store-active.msg')
                            );
                            return;
                        }
                        alert('error');
                    });
                    return;
                }
                console.log(res);
                LOCAL_STORAGE.removeTerminalAccount(key, terminal);
                refreshStoreTerminal(storeRow, key);
                DEMO_UTIL.stopLoad();
            });
        });
    });
};

var addTerminal = function(obj) {
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;
    var storeRow = $(obj.closest('div[name="store-row"]'));
    var key = storeRow.find('input[name="store-key"]').val();

    ETH_UTIL.generateNewAccount(function(_newAccount) {
        var storeMasterAccount = LOCAL_STORAGE.getStoreMasterAccount(key);
        var tokenAddress = LOCAL_STORAGE.getTokenAddress();
        var contract = ETH_UTIL.getContract(storeMasterAccount);
        var participantAddress, nonce, sign;
        contract.call('', 'ProxyController', 'getParticipantAndNonce', [tokenAddress, storeMasterAccount.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
            if (err) {
                console.error(err);
                alert('error');
                return;
            }
            console.log(res);
            participantAddress = res[0];
            nonce = res[1].toString(10);
            storeMasterAccount.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'bytes32', 'address', 'uint'], [participantAddress, 'addTerminalWithSign', key, _newAccount.getAddress(), nonce]), function(err, res) {
                if (err) {
                    console.error(err);
                    alert('error');
                    return;
                }
                console.log(res);
                sign = res;
                contract.sendTransaction('', 'ProxyController', 'addTerminal', [tokenAddress, key, _newAccount.getAddress(), nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                    if (err) {
                        console.error(err);
                        getStoreStatus(key, function(status) {
                            DEMO_UTIL.stopLoad();
                            if (!status) {
                                DEMO_UTIL.okDialog(
                                demoMsg('common.dialog.err-no-store-active.title'),
                                demoMsg('common.dialog.err-no-store-active.msg')
                                );
                                return;
                            }
                            alert('error');
                        });
                        return;
                    }
                    console.log(res);
                    LOCAL_STORAGE.addTerminalAccount(key, _newAccount);
                    refreshStoreTerminal(storeRow, key);
                    DEMO_UTIL.stopLoad();
                });
            });
        });
    });
};

/* create store */
var createStore = function() {
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;

    var name = $('#store-name').val().trim();
    var maxLiabilities = $('#store-max-liabilities').val().trim();

    // validate(very simple for DEMO)
    if (!name || !maxLiabilities) {
        DEMO_UTIL.okDialog(
            demoMsg('common.dialog.err-required.title'),
            demoMsg('common.dialog.err-required.msg')
        );
        return DEMO_UTIL.stopLoad();
    }
    if (!maxLiabilities.match(/[1-9][0-9]{0,17}/)) {
        DEMO_UTIL.okDialog(
            demoMsg('store.dialog.err-invalid-max-liabilities.title'),
            demoMsg('store.dialog.err-invalid-max-liabilities.msg')
        );
        return DEMO_UTIL.stopLoad();
    }

    ETH_UTIL.generateNewAccount(function(_newAccount) {
        var storeKey = LOCAL_STORAGE.getStoreStatusSize() + 1;
        var tokenAddress = LOCAL_STORAGE.getTokenAddress();
        var creator = LOCAL_STORAGE.getCreatorAccount();
        var participantAddress, nonce, sign;
        var contract = ETH_UTIL.getContract(LOCAL_STORAGE.getCreatorAccount());
        contract.call('', 'ProxyController', 'getParticipantAndNonce', [tokenAddress, creator.getAddress()], PROXY_CONTROLLER_ABI, function(err, res) {
            if (err) {
                console.error(err);
                alert('error');
                return;
            }
            console.log(res);
            participantAddress = res[0];
            nonce = res[1].toString(10);
            creator.sign('', ethClient.utils.hashBySolidityType(['address', 'bytes32', 'bytes32', 'bytes32', 'address', 'uint', 'uint'], [participantAddress, 'addStoreWithSign', storeKey, name, _newAccount.getAddress(), maxLiabilities, nonce]), function(err, res) {
                if (err) {
                    console.error(err);
                    alert('error');
                    return;
                }
                console.log(res);
                sign = res;
                contract.sendTransaction('', 'ProxyController', 'addStore', [tokenAddress, storeKey, name, _newAccount.getAddress(), maxLiabilities, nonce, sign], PROXY_CONTROLLER_ABI, function(err, res) {
                    if (err) {
                        console.error(err);
                        alert('error');
                        return;
                    }
                    console.log(res);
                    LOCAL_STORAGE.putStoreMasterAccount(storeKey, _newAccount);
                    LOCAL_STORAGE.addStoreStatus(storeKey, name, maxLiabilities);
                    addStoreRow({ key: storeKey, name: name }, false, maxLiabilities);
                    $('#store-name').val(name);
                    $('#store-max-liabilities').val(maxLiabilities);
                    DEMO_UTIL.stopLoad();
                });
            });
        });
    });
};

var getStoreStatus = function (storeKey, callback) {
    var storeMasterAccount = LOCAL_STORAGE.getStoreMasterAccount(storeKey);
    var contract = ETH_UTIL.getContract(storeMasterAccount);
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
