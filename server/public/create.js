$(document).ready(function() {

    var creatorAccount = LOCAL_STORAGE.getCreatorAccount();
    if (creatorAccount) {
        refreshPage();
        return;
    }

    DEMO_UTIL.confirmDialog(
        demoMsg('create.dialog.err-no-account.title'),
        demoMsg('create.dialog.err-no-account.msg'),
        function() {
            ETH_UTIL.generateNewAccount(function(_newAccount) {
                LOCAL_STORAGE.setCreatorAccount(_newAccount);
                refreshPage();
            });
            $(this).dialog('close');
        },
        function() {
            window.location.href = './index.html';
        }
    );
});

var refreshPage = function() {
    var tokenAddress = LOCAL_STORAGE.getTokenAddress();
    if (tokenAddress) {
        var symbol, name, totalSupply;
        var contract = ETH_UTIL.getContract(LOCAL_STORAGE.getCreatorAccount());
        contract.call('', 'ProxyController', 'getSymbol', [tokenAddress], PROXY_CONTROLLER_ABI, function(err, res) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(res);
            symbol = ETH_UTIL.toUtf8(res[0]);
            contract.call('', 'ProxyController', 'getName', [tokenAddress], PROXY_CONTROLLER_ABI, function(err, res) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(res);
                name = ETH_UTIL.toUtf8(res[0]);
                contract.call('', 'ProxyController', 'getTotalSupply', [tokenAddress], PROXY_CONTROLLER_ABI, function(err, res) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    console.log(res);
                    totalSupply = res.toString(10);
                    $('#token-area').css('display', 'block');
                    $('#create-token-area').css('display', 'none');
                    $('#token-symbol-view').html(symbol);
                    $('#token-name-view').html(name);
                    $('#token-supply-view').html(totalSupply);
                });
            });
        });
    } else {
        $('#token-area').css('display', 'none');
        $('#create-token-area').css('display', 'block');
    }
};

/* create token */
var createToken = function() {
    if (DEMO_UTIL.isLoading()) return;
    if (!DEMO_UTIL.startLoad()) return;

    var tokenSymbol = $('#token-symbol').val().trim();
    var tokenName = $('#token-name').val().trim();

    // validate(very simple for DEMO)
    if (!tokenSymbol || !tokenName) {
        DEMO_UTIL.okDialog(
            demoMsg('common.dialog.err-required.title'),
            demoMsg('common.dialog.err-required.msg')
        );
        return DEMO_UTIL.stopLoad();
    }
    var tokenNameHex = ETH_UTIL.fromUtf8(tokenName);
    if (tokenNameHex.length > 66) {
        DEMO_UTIL.okDialog(
            demoMsg("create.dialog.err-token-name-too-long.title"),
            demoMsg("create.dialog.err-token-name-too-long.msg")
        );
        return DEMO_UTIL.stopLoad();
    }
    var tokenSymbolHex = ETH_UTIL.fromUtf8(tokenSymbol);
    if (tokenSymbolHex.length > 66) {
        alert('token symbole length is too long');
        return;
    }

    // create
    var contract = ETH_UTIL.getContract(LOCAL_STORAGE.getCreatorAccount());
    contract.sendTransaction('', 'Demo', 'createToken', [tokenSymbolHex, tokenNameHex], DEMO_ABI,
        function(err, res) {
            if (err) {
                console.error(err);
                alert('error! check console!');
                return DEMO_UTIL.stopLoad();
            }
            console.log(res);
            var getTokenContractAddress = function(txHash, callback) {
                contract.getTransactionReceipt(txHash, function(err, res) {
                    if (err) callback(err);
                    else if (res) callback(null, '0x' + res.logs[0].data.substr(-40));
                    else setTimeout(function() { getTokenContractAddress(txHash, callback); }, 5000);
                });
            };
            getTokenContractAddress(res, function(err, tokenAddr) {
                LOCAL_STORAGE.setTokenAddress(tokenAddr);
                refreshPage();
                return DEMO_UTIL.stopLoad();
            });
        }
    );
};