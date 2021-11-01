module TSOS{
    export class Dispatcher{

        public contextSwitch(newPcb): void{ // used to context switch to a "new" pcb
            
            if(_Scheduler.runningPID != -1){ // if there is a running process
             _CPU.isExecuting = false;
             let tempPcb = new PCB(_Scheduler.runningPID, _CurrentSeg*255, (_CurrentSeg+1)*255);
             tempPcb.PC = _CPU.PC;
             tempPcb.IR = _CPU.IR;
             tempPcb.xReg = _CPU.Xreg;
             tempPcb.yReg = _CPU.Yreg;
             tempPcb.zFlag    = _CPU.Zflag;
             tempPcb.Acc = _CPU.Acc;
             tempPcb.state = WAITING;
             _Scheduler.readyQueue.enqueue(tempPcb); //putting the old stuff to the back
         
             
                 
                 _CPU.PC       = newPcb.PC; 
                 _CPU.IR       = newPcb.IR;
                 _CPU.Xreg     = newPcb.xReg;
                 _CPU.Yreg     = newPcb.yReg;
                 _CPU.Zflag    = newPcb.zFlag;
                 _CPU.Acc      = newPcb.Acc;
                 _Scheduler.runningPID = newPcb.pid;
                 _CurrentSeg = newPcb.base / 255;
                
                 _CPU.isExecuting = true; // putting the new stuff on
            }else{ // if nothing was happening before, just put on the new stuff
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
        public remPcb(): void{ // used to clear the running process
            if(_Scheduler.runningPID != -1){
                _CPU.isExecuting = false;
                let tempPcb = new PCB(_Scheduler.runningPID, _CurrentSeg*255, (_CurrentSeg+1)*255);
                tempPcb.PC = _CPU.PC;
                tempPcb.IR = _CPU.IR;
                tempPcb.xReg = _CPU.Xreg;
                tempPcb.yReg = _CPU.Yreg;
                tempPcb.zFlag    = _CPU.Zflag;
                tempPcb.Acc = _CPU.Acc;
                tempPcb.state = TERMINATED;
                _Scheduler.readyQueue.enqueue(tempPcb); // terminating the running pid and putting the terminated pcb on the back of the queue
                _Scheduler.runningPID = -1;
                _CPU.isExecuting = true; // used with the assumption that something else will find what to do next
        }else{
            console.log("this shouldn't happen");
        }
    }
}
}