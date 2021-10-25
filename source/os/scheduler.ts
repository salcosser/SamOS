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
        
        public runningPID: number =;
        public quantum: number = 6;
        public cQuant: number = -1;
        constructor(){
           // this.readyQueue = new Queue();
        }
        init(){
            
        }
        public setupProcess(inputCode): boolean{

            let loadedSeg = _MemoryManager.loadMemory(inputCode);
            if(loadedSeg == -1){
                return false;
            }
            
            let base = (loadedSeg * 256) - 1;
            let memEnd = (inputCode.length).toString(16);
            let newPcb = new PCB(_Scheduler.pid,base, base+ 255);
            _MemoryManager.segAllocStatus[loadedSeg] = _Scheduler.pid;
            _StdOut.putText(`Loaded new program, PID ${_Scheduler.pid}`);
            _StdOut.advanceLine();
            _Scheduler.residentSet.set(_Scheduler.pid, newPcb);
            _Scheduler.pid++;
            return true;
        }

        public runProcess(pid): void{
           
            let tempPCB: TSOS.PCB   = _Scheduler.residentSet.get(parseInt(pid));
            if(tempPCB){
                
                tempPCB.state = "ready";
                _Scheduler.readyQueue.enqueue(tempPCB);// in later projects, more will be added to this process
             
            }else{
               _StdOut.putText("PCB with PID of " + pid + " was not found in the resident queue.");
                return;
            }
          
            this.residentSet.delete(parseInt(pid));
            _StdOut.putText(`PID ${pid[0]} has started.`);
            _StdOut.advanceLine();
            
        }

        public termProc(){
            
            
        }

        public keepTime(): void{
            if(this.cQuant == -1){
                if(!this.readyQueue.isEmpty()){
                    let newProc = this.readyQueue.dequeue();
                    _Dispatcher.contextSwitch(newProc);
                    this.cQuant = 0;
                }
            }else{
                this.cQuant++;
                if(this.cQuant == this.quantum && !this.readyQueue.isEmpty()){
                    let newProc = this.readyQueue.dequeue();
                    _Dispatcher.contextSwitch(newProc);
                    this.cQuant = 0;
                }
            }
        }
       
    }
}