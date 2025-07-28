import "dotenv/config";
import {IProviderService} from "./services/providers/IProviderService";
import {ProviderService} from "./services/providers/EthersProviderService";

const rpcUrl = process.env.RPC_URL!;
const sequencerAddress = process.env.SEQUENCER_ADDRESS!;

const providerService: IProviderService = new ProviderService(rpcUrl, sequencerAddress);

(async function main() {
    console.log("Starting Maker Job Monitor...");
    const block = await providerService.getCurrentBlockNumber();
    console.log("Current block:", block);
})();



