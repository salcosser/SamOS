module TSOS{
    export class Scheduler{
        //public readyQueue: TSOS.Queue;
        public readyPCB: TSOS.PCB;
        public pid = 0;
        public resPCB: TSOS.PCB;
        constructor(){
           // this.readyQueue = new Queue();
        }
        init(){
            
        }
        public setupProcess(inputCode): void{
            _MemoryManager.loadMemory(inputCode);
            var memEnd = (inputCode.length).toString(16);
            var newPcb = new PCB("00",memEnd, this.pid);
            _StdOut.putText(`Loaded new program, PID ${this.pid}`);
            _StdOut.advanceLine();
            this.resPCB = newPcb;
            this.pid++;
        }

        public runProcess(pid){
            var tempPCB   = this.resPCB;
            tempPCB.state = "ready";
            this.readyPCB = tempPCB;
            _CPU.PC       = this.readyPCB.PC;
            _CPU.IR       = this.readyPCB.IR;
            _CPU.Xreg     = this.readyPCB.xReg;
            _CPU.Yreg     = this.readyPCB.yReg;
            _CPU.Zflag    = this.readyPCB.zFlag;
            _CPU.Acc      = this.readyPCB.Acc;
            _CPU.isExecuting = true;
        }
    }
}