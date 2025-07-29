import { Interface } from "ethers";

import AutoLineJob from "abis/jobs/AutoLineJob.json";
import D3MJob from "abis/jobs/D3MJob.json";
import OracleJob from "abis/jobs/OracleJob.json";
import FlapJob from "abis/jobs/FlapJob.json";
import LerpJob from "abis/jobs/LerpJob.json";
import ClipperMomJob from "abis/jobs/ClipperMomJob.json";
import ThresholdSteward from "abis/jobs/PSMThresholdSteward.json";

import { Job } from "../model/job";

function createJobEntry(address: string, name: string, abiJson: any): [string, Job] {
    return [
        address.toLowerCase(),
        new Job(name, address, new Interface(abiJson)),
    ];
}

export const JobRegistry: Record<string, Job> = Object.fromEntries([
    createJobEntry("0x67ad4000e73579b9725ee3a149f85c4af0a61361", "AutoLineJob", AutoLineJob),
    createJobEntry("0x2ea4ade144485895b923466b4521f5ebc03a0aef", "D3MJob", D3MJob),
    createJobEntry("0xe717ec34b2707fc8c226b34be5eae8482d06ed03", "OracleJob", OracleJob),
    createJobEntry("0xc32506e9bb590971671b649d9b8e18cb6260559f", "FlapJob", FlapJob),
    createJobEntry("0x8f8f2fc1f0380b9ff4fe5c3142d0811ac89e32fb", "LerpJob", LerpJob),
    createJobEntry("0x7e93c4f61c8e8874e7366cdbfeff934ed089f9ff", "ClipperMomJob", ClipperMomJob),
    createJobEntry("0x0c86162ba3e507592fc8282b07cf18c7f902c401", "PSMThresholdSteward", ThresholdSteward),
    createJobEntry("0x6464C34A02DD155dd0c630CE233DD6e21C24F9A5", "ThresholdSteward", ThresholdSteward),
]);

export function createJobFromAddress(address: string): Job | undefined {
    const normalized = address.trim().toLowerCase();
    const job = JobRegistry[normalized];
    if (!job) {
        console.warn(`No ABI or job registered for address: ${address}`);
        return undefined;
    }
    return job;
}
