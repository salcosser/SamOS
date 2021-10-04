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
        constructor(pid){
            this.base  = "00";// both to be updated in the future
            this.limit = "ff";
            this.pid   = pid;
            this.PC    = 0;
            this.Acc   = "00";
            this.xReg  = "00";
            this.yReg  = "00";
            this.zFlag = "00";
            this.state = "resident";
            this.IR    = _MemoryManager.getMemory(this.base);
        }
    }
}