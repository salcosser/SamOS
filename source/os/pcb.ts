module TSOS{
    export class PCB{
        public base: string;
        public limit: string;
        public pid: number;
        public PC: number;
        public IR: string;
        public xReg: string;
        public yReg: string;
        public zFlag: string;
        public Acc: string;
        public state: string;
        constructor(base, limit, pid){
            this.base  = base;
            this.limit = limit;
            this.pid   = pid;
            this.PC    = 0;
            this.Acc   = "00";
            this.xReg  = "00";
            this.yReg  = "00";
            this.zFlag = "00";
            this.state = "resident";
            this.IR    = _MemoryManager.getMemory(base);
        }
    }
}