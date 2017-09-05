const ContractNameService = artifacts.require('./ContractNameService.sol'),
    Demo_v1 = artifacts.require('./Demo_v1.sol'),
    DemoLogic_v1 = artifacts.require('./DemoLogic_v1.sol'),
    DemoCreateParticipant = artifacts.require('./DemoCreateParticipant.sol');

module.exports = function(deployer) {
    deployer.deploy(DemoCreateParticipant).then(function() {
        return deployer.deploy(DemoLogic_v1, ContractNameService.address, DemoCreateParticipant.address);
    }).then(function(){
        return deployer.deploy(Demo_v1, ContractNameService.address, DemoLogic_v1.address);
    }).then(function() {
        return ContractNameService.deployed();
    }).then(function(instance) {
        return instance.setContract('Demo', 1, Demo_v1.address, DemoLogic_v1.address);
    });
}

