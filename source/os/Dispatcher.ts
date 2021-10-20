module TSOS{
    export class Dispatcher{

        public contextSwitch(newPcb): void{
            if(_Scheduler.runningPID){
             _CPU.isExecuting = false;
             let tempPcb = new PCB(_Scheduler.runningPID, _CurrentSeg*255, (_CurrentSeg+1)*255);
             tempPcb.PC = _CPU.PC;
             tempPcb.IR = _CPU.IR;
             tempPcb.xReg = _CPU.Xreg;
             tempPcb.yReg = _CPU.Yreg;
             tempPcb.zFlag    = _CPU.Zflag;
             tempPcb.Acc = _CPU.Acc;
             tempPcb.state = "ready";
             _Scheduler.readyQueue.enqueue(tempPcb);
         
             
                 
                 _CPU.PC       = newPcb.PC;
                 _CPU.IR       = newPcb.IR;
                 _CPU.Xreg     = newPcb.xReg;
                 _CPU.Yreg     = newPcb.yReg;
                 _CPU.Zflag    = newPcb.zFlag;
                 _CPU.Acc      = newPcb.Acc;
                 _Scheduler.runningPID = newPcb.pid;
                 _CurrentSeg = newPcb.base / 255;
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
    }
}