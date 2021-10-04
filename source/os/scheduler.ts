module TSOS{
    export class Scheduler{
        //public readyQueue: TSOS.Queue;
        public readyQueue: TSOS.Queue;
        public residentSet = new Map();
        public pid = 0;
        public resPCB: TSOS.PCB;
        public runningPID: number;
        constructor(){
           // this.readyQueue = new Queue();
        }
        init(){
            
        }
        public setupProcess(inputCode): void{
            _MemoryManager.loadMemory(inputCode);
            let memEnd = (inputCode.length).toString(16);
            let newPcb = new PCB(_Scheduler.pid);
            _StdOut.putText(`Loaded new program, PID ${_Scheduler.pid}`);
            _StdOut.advanceLine();
            _Scheduler.residentSet.set(_Scheduler.pid, newPcb);
            console.log("did this");
            console.log(_Scheduler.residentSet.get(_Scheduler.pid).pid);
            _Scheduler.pid++;
        }

        public runProcess(pid): void{
            console.log("I got pid:"+ pid);
            let tempPCB   = _Scheduler.residentSet.get(pid);
            console.log("pid:" + tempPCB.pid+ " is running.");
            tempPCB.state = "ready";
            _Scheduler.readyQueue.enqueue(tempPCB);
            _Scheduler.contextSwitch();
            //this.residentSet.delete(pid);

            
        }

        public contextSwitch(): void{
           if(_Scheduler.runningPID){
            _CPU.isExecuting = false;
            let tempPcb = new PCB(_Scheduler.runningPID);
            tempPcb.PC = _CPU.PC;
            tempPcb.IR = _CPU.IR;
            tempPcb.xReg = _CPU.Xreg;
            tempPcb.yReg = _CPU.Yreg;
            tempPcb.zFlag    = _CPU.Zflag;
            tempPcb.Acc = _CPU.Acc;
            _Scheduler.residentSet.set(_Scheduler.runningPID, tempPcb);
            let newPcb = _Scheduler.readyQueue.dequeue();
            _CPU.PC       = newPcb.PC;
            _CPU.IR       = newPcb.IR;
            _CPU.Xreg     = newPcb.xReg;
            _CPU.Yreg     = newPcb.yReg;
            _CPU.Zflag    = newPcb.zFlag;
            _CPU.Acc      = newPcb.Acc;
            _Scheduler.runningPID = newPcb.pid;
            _CPU.isExecuting = true;
           }else{
            _CPU.isExecuting = false;
            let newPcb = _Scheduler.readyQueue.dequeue();
            _CPU.PC       = newPcb.PC;
            _CPU.IR       = newPcb.IR;
            _CPU.Xreg     = newPcb.xReg;
            _CPU.Yreg     = newPcb.yReg;
            _CPU.Zflag    = newPcb.zFlag;
            _CPU.Acc      = newPcb.Acc;
            _Scheduler.runningPID = newPcb.pid;
            _CPU.isExecuting = true;
           }
            
        }
    }
}