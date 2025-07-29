import {Contract} from "ethers";

export class SequencerContractService {
    constructor(private readonly contract: Contract) {}

    public async numJobs(): Promise<number> {
        return await this.contract.numJobs();
    }

    public async jobAt(index: number): Promise<string> {
        return await this.contract.jobAt(index);
    }
}
