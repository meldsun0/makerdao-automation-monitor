import "dotenv/config";
import {ProviderServiceInterface} from "./services/providers/provider-service-interface";
import {ProviderService} from "./services/providers/provider-service";
import {JobMonitorService} from "./services/job-monitor";

const rpcUrl = process.env.RPC_URL!;
const sequencerAddress = process.env.SEQUENCER_ADDRESS!;

const providerService: ProviderServiceInterface = new ProviderService(rpcUrl, sequencerAddress);

(async function main() {
    const currentBlock = await providerService.getCurrentBlockNumber();
    console.log(`Starting Maker Job Monitor at block  ${currentBlock} `);
    const monitor = new JobMonitorService(providerService, currentBlock, true);
    await monitor.initSync();
})();





