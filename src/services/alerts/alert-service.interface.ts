


export interface AlertServiceInterface {
    sendAlert(name: string, latestBlock: number | null, currentBlock: number): Promise<void> ;
}