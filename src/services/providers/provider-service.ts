import {Contract, ethers} from "ethers";
import {ProviderServiceInterface} from "./provider-service-interface";
import { logger } from "../../utils/logger";

const SEQUENCER_ABI = [
    "function numJobs() view returns (uint256)",
    "function jobAt(uint256) view returns (address)",
    "function getMaster() view returns (bytes32)",
];

export class ProviderService implements ProviderServiceInterface {
    private readonly provider: ethers.JsonRpcProvider;
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
            logger.error("Failed to get block number:", error);
            throw error;
        }
    }

    async getLogs(params: ethers.Filter): Promise<ethers.Log[]> {
        try {
            return await this.provider.getLogs(params);
        } catch (error) {
            logger.error("Failed to fetch logs:", error);
            throw error;
        }
    }

    public async numJobs(): Promise<number> {
        return await this.sequencerContract.numJobs();
    }

    public async jobAt(index: number): Promise<string> {
        return await this.sequencerContract.jobAt(index);
    }
}
