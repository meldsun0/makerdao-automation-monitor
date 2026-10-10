# Automation Workable Alert

This is a long-running **Node.js** process that monitors **MakerDAO Keeper jobs** and sends a **Discord alert** if any job hasn’t been worked in the last **1000 consecutive blocks**.

Built with **TypeScript**, **ethers.js**, and **ts-node**, the service is designed for decentralized monitoring of on-chain automation infrastructure.

---

## **Context**

MakerDAO has several jobs which require onchain automation. In interest of decentralisation they have built a Sequencer(https://github.com/makerdao/dss-cron/blob/master/src/Sequencer.sol), in charge of supporting multiple Keeper Networks to work.

Keeper Networks will be required to watch the activeJobs array in the Sequencer and find all instances of available jobs. All jobs will be deployed contracts which implement the IJob interface (https://github.com/makerdao/dss-cron/blob/master/src/interfaces/IJob.sol).


This offchain tool watches those jobs and reports when any of them haven't been worked in the last **1000 consecutive blocks**.

---
### Sequencer

- [0x238b4E35dAed6100C6162fAE4510261f88996EC9](https://etherscan.io/address/0x238b4E35dAed6100C6162fAE4510261f88996EC9#code)

### Active Jobs

| Name            | Address |
|-----------------|---------|
| AutoLineJob     | [0x67AD4000e73579B9725eE3A149F85C4Af0A61361](https://etherscan.io/address/0x67AD4000e73579B9725eE3A149F85C4Af0A61361#code) |
| LerpJob         | [0x8F8f2FC1F0380B9Ff4fE5c3142d0811aC89E32fB](https://etherscan.io/address/0x8F8f2FC1F0380B9Ff4fE5c3142d0811aC89E32fB#code) |
| D3MJob          | [0x2Ea4aDE144485895B923466B4521F5ebC03a0AeF](https://etherscan.io/address/0x2Ea4aDE144485895B923466B4521F5ebC03a0AeF#code) |
| ClipperMomJob   | [0x7E93C4f61C8E8874e7366cDbfeFF934Ed089f9fF](https://etherscan.io/address/0x7E93C4f61C8E8874e7366cDbfeFF934Ed089f9fF#code) |
| OracleJob       | [0xe717Ec34b2707fc8c226b34be5eae8482d06ED03](https://etherscan.io/address/0xe717Ec34b2707fc8c226b34be5eae8482d06ED03#code) |
| FlapJob         | [0xc32506E9bB590971671b649d9B8e18CB6260559F](https://etherscan.io/address/0xc32506E9bB590971671b649d9B8e18CB6260559F#code) |

### Other Jobs Identified

| Name                | Address |
|---------------------|---------|
| LitePsmJob          | [0x0c86162ba3e507592fc8282b07cf18c7f902c401](https://etherscan.io/address/0x0c86162ba3e507592fc8282b07cf18c7f902c401#code) |
| CronRewardsDistJob  | [0x6464c34a02dd155dd0c630ce233dd6e21c24f9a5](https://etherscan.io/address/0x6464c34a02dd155dd0c630ce233dd6e21c24f9a5#code) |

---

### Requirements
To run this project locally, you need:

- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
 
### Quickstart

```bash
git clone https://github.com/meldsun0/makerdao-automation-monitor.git
cd makerdao-automation-monitor
npm install
# Edit .env with your RPC and Discord webhook
npm run dev 
```
---

### Example Configuration

```yaml
RPC_URL=https://mainnet.infura.io/v3/a32b31...
SEQUENCER_ADDRESS=0x238b4E35dAed6100C6162fAE4510261f88996EC9
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/140013.../WWJDqu...
LOG_LEVEL=info
 ```    
---
### Docker

Make sure the following exist in your local project **before building the image**:

- `dist/` folder with compiled `.js` files: Run `npm run build` to generate it
- `node_modules/` with installed dependencies: Run `npm install` to populate it)
- `.env` file with your environment configuration
- `package.json` for metadata and runtime dependencies

```bash
docker build -t maker-job-monitor .
docker run  maker-job-monitor
```

---
### Testing
```bash
npm test
```
---

### NPM Scripts

| Command         | Description                                      |
|----------------|--------------------------------------------------|
| `npm run dev`  | Run directly from TypeScript using `ts-node`     |
| `npm run build`| Compile TypeScript to JavaScript in `dist/`      |
| `npm start`    | Run compiled JS from `dist/index.js`             |
| `npm test`     | Run all unit tests using `jest`                  |


### Caveats
### Testing on Other Networks
This project was originally designed to monitor **MakerDAO Keeper jobs on Ethereum Mainnet**. It includes **hardcoded ABIs and job addresses** that are specific to Mainnet deployments.

If you want to test or deploy this monitor on a testnet, keep in mind:

- **Mainnet job contracts may not exist on testnets**, or may differ in logic and address.
- If you keep using Mainnet job ABIs and addresses, **log parsing or contract calls will fail**.



