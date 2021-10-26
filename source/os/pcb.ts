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
        constructor(pid, base, limit){
            this.base  = base;// both to be updated in the future
            this.limit = limit;
            this.pid   = pid;
            this.PC    = base;
            this.Acc   = "00";
            this.xReg  = "00";
            this.yReg  = "00";
            this.zFlag = "00";
            this.state = RESIDENT;
            this.IR    = _MemoryManager.getMemoryStrict(base,pid);
        }
    }
}