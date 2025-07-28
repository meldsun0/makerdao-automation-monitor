import {Contract, ethers} from "ethers";
import {IProviderService} from "./IProviderService";
import {SequencerContractService} from "./SequencerContractService";


const SEQUENCER_ABI = [
    "function numJobs() view returns (uint256)",
    "function jobAt(uint256) view returns (address)",
    "function getMaster() view returns (bytes32)",
    "function isMaster(bytes32) view returns (bool)"
];

export class ProviderService implements IProviderService {
    private provider: ethers.JsonRpcProvider;
    private readonly sequencerContract: Contract;

    constructor(rpcUrl: string, sequencerAddress: string) {
        const url = rpcUrl || process.env.RPC_URL;
        if (!url) {
            throw new Error("RPC URL is not defined in environment or constructor.");
        }
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.sequencerContract = new Contract(
            sequencerAddress,
            SEQUENCER_ABI,
            this.provider
        );
    }


    async getCurrentBlockNumber(): Promise<number> {
        try {
            return await this.provider.getBlockNumber();
        } catch (error) {
            console.error("Failed to get block number:", error);
            throw error;
        }
    }

    async getLogs(params: ethers.Filter): Promise<ethers.Log[]> {
        try {
            return await this.provider.getLogs(params);
        } catch (error) {
            console.error("Failed to fetch logs:", error);
            throw error;
        }
    }

    async getBlockTimestamp(blockNumber: number): Promise<number> {
        try {
            const block = await this.provider.getBlock(blockNumber);
            if (!block) throw new Error("Block not found");
            return block.timestamp;
        } catch (error) {
            console.error("Failed to get block timestamp:", error);
            throw error;
        }
    }

    public getSequencerContractService(): SequencerContractService {
        return new SequencerContractService(this.sequencerContract);
    }
}
