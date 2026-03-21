// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ORBSToken
 * @notice Token ERC-20 da plataforma PredLab.
 *
 * Supply fixo: 1.000.000.000 ORBS (1 bilião)
 *
 * Taxa de transferência: 2%
 *   - 60% → Rewards Pool  (alimenta rewards de acurácia)
 *   - 30% → Treasury      (operações da plataforma)
 *   - 10% → Burn          (deflação gradual)
 *
 * Endereços isentos de taxa: rewardsPool, treasury, owner (para distribuição inicial)
 */
contract ORBSToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18;

    // Taxa em basis points (200 = 2%)
    uint256 public transferFeeBps = 200;

    address public rewardsPool;
    address public treasury;

    // Endereços isentos de taxa (pool, treasury, owner)
    mapping(address => bool) public feeExempt;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event RewardsPoolUpdated(address indexed oldAddr, address indexed newAddr);
    event TreasuryUpdated(address indexed oldAddr, address indexed newAddr);
    event FeeExemptUpdated(address indexed account, bool exempt);
    event TransferFeeUpdated(uint256 oldBps, uint256 newBps);

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    constructor(
        address _rewardsPool,
        address _treasury
    ) ERC20("ORBS", "ORBS") Ownable(msg.sender) {
        require(_rewardsPool != address(0), "Invalid rewards pool");
        require(_treasury != address(0), "Invalid treasury");

        rewardsPool = _rewardsPool;
        treasury = _treasury;

        // Isentar pools e deployer de taxa
        feeExempt[_rewardsPool] = true;
        feeExempt[_treasury] = true;
        feeExempt[msg.sender] = true;

        // Mint supply total para o deployer — distribuição feita manualmente depois
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    // -----------------------------------------------------------------------
    // Transfer com taxa
    // -----------------------------------------------------------------------

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // Sem taxa em: mint (from=0), burn (to=0), ou endereços isentos
        if (from == address(0) || to == address(0) || feeExempt[from] || feeExempt[to]) {
            super._update(from, to, amount);
            return;
        }

        uint256 fee = (amount * transferFeeBps) / 10_000;

        if (fee == 0) {
            super._update(from, to, amount);
            return;
        }

        uint256 rewardShare  = (fee * 60) / 100;
        uint256 treasuryShare = (fee * 30) / 100;
        uint256 burnShare    = fee - rewardShare - treasuryShare; // 10% — evita rounding errors

        // Transfere para rewards pool
        super._update(from, rewardsPool, rewardShare);
        // Transfere para treasury
        super._update(from, treasury, treasuryShare);
        // Burn
        super._update(from, address(0), burnShare);
        // Transfere valor líquido para destinatário
        super._update(from, to, amount - fee);
    }

    // -----------------------------------------------------------------------
    // Admin
    // -----------------------------------------------------------------------

    function setRewardsPool(address _rewardsPool) external onlyOwner {
        require(_rewardsPool != address(0), "Invalid address");
        emit RewardsPoolUpdated(rewardsPool, _rewardsPool);
        feeExempt[rewardsPool] = false;
        rewardsPool = _rewardsPool;
        feeExempt[_rewardsPool] = true;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        emit TreasuryUpdated(treasury, _treasury);
        feeExempt[treasury] = false;
        treasury = _treasury;
        feeExempt[_treasury] = true;
    }

    function setFeeExempt(address account, bool exempt) external onlyOwner {
        feeExempt[account] = exempt;
        emit FeeExemptUpdated(account, exempt);
    }

    function setTransferFee(uint256 newBps) external onlyOwner {
        require(newBps <= 500, "Fee too high"); // max 5%
        emit TransferFeeUpdated(transferFeeBps, newBps);
        transferFeeBps = newBps;
    }
}
