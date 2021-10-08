/*
Scheduler class for SamOS
Scheduler is responsible for setting up and managing processes loaded in by the user.
Scheduler is also responsible for owning the ready queue as well as the resident queue.



*/






module TSOS{
    export class Scheduler{
        //public readyQueue: TSOS.Queue;
        public readyQueue: TSOS.Queue = new Queue();
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
          
            _Scheduler.pid++;
        }

        public runProcess(pid): void{
           
            let tempPCB: TSOS.PCB   = _Scheduler.residentSet.get(parseInt(pid));
            if(tempPCB){
                
                tempPCB.state = "ready";
                _Scheduler.readyQueue.enqueue(tempPCB);// in later projects, more will be added to this process
                let rPcb = _Scheduler.readyQueue.dequeue();
                this.runningPID = parseInt(pid);
                _Scheduler.contextSwitch(rPcb);
            }else{
               _StdOut.putText("PCB with PID of " + pid + " was not found in the resident queue.");
                return;
            }
          
            this.residentSet.delete(parseInt(pid));
            _StdOut.putText(`PID ${pid[0]} has started.`);
            _StdOut.advanceLine();
            
        }

        public contextSwitch(newPcb): void{
           if(_Scheduler.runningPID){
            _CPU.isExecuting = false;
            let tempPcb = new PCB(_Scheduler.runningPID);
            tempPcb.PC = _CPU.PC;
            tempPcb.IR = _CPU.IR;
            tempPcb.xReg = _CPU.Xreg;
            tempPcb.yReg = _CPU.Yreg;
            tempPcb.zFlag    = _CPU.Zflag;
            tempPcb.Acc = _CPU.Acc;
            tempPcb.state = "resident";
            _Scheduler.residentSet.set(_Scheduler.runningPID, tempPcb);
        
            
                
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
        public termProc(){
            
            
        }
    }
}