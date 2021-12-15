module TSOS{
    export class PCB{
        public base: string;
        public limit: string;
        public pid: number;
        public PC: string;
        public IR: string;
        public xReg: string;
        public yReg: string;
        public zFlag: string;
        public Acc: string;
        public state: number;
        public swapped: boolean;
        constructor(pid, base, limit){
            this.base  = base;// both to be updated in the future
            this.limit = limit;
            this.pid   = pid;
            this.PC    = "00";
            this.Acc   = "00";
            this.xReg  = "00";
            this.yReg  = "00";
            this.zFlag = "00";
            this.state = RESIDENT;
            this.IR    = _MemoryManager.getMemoryPerSeg(0,(base / 256));
            this.swapped = false;
        }
    }
}