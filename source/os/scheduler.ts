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
        public pcbLocSet=  new Map();
        
        public runningPID: number = -1;
        public quantum: number = 6;
        public cQuant: number = -1;
        public procTime = new Map();

        constructor(){
          
        }
        init(){
            
        }
        public setupProcess(inputCode): boolean{ 
            while(inputCode.length < 256){
                inputCode[inputCode.length] = "00";
            }
            let loadedSeg = _MemoryManager.loadMemory(inputCode);
            
            
            
            if(loadedSeg != -1){
               // return false;
               _MemoryManager.segAllocStatus[loadedSeg] = _Scheduler.pid;
        
               let base = (loadedSeg * 256);
               let memEnd = (inputCode.length).toString(16);
               let newPcb = new PCB(_Scheduler.pid,base, base+ 255);
               _StdOut.putText(`Loaded new program, PID ${_Scheduler.pid}`);
               _StdOut.advanceLine();
               _Scheduler.residentSet.set(_Scheduler.pid, newPcb);// not ready yet
               this.pcbLocSet.set(_Scheduler.pid, IN_MEM);
               _Scheduler.pid++;
               _Kernel.updateProcViewer();
                
            }else{
                let base = -1;
                
                let newPcb = new PCB(_Scheduler.pid,11,11);
                let resp = _FileSystem.makeSwapFile(inputCode, _Scheduler.pid);
                if(resp){
                    _StdOut.putText(`Loaded new program, PID ${_Scheduler.pid}`);
                    _StdOut.advanceLine();
                    _Scheduler.residentSet.set(_Scheduler.pid, newPcb);// not ready yet
                    this.pcbLocSet.set(_Scheduler.pid, ON_DISK);
                    _Scheduler.pid++;
                    _Kernel.updateProcViewer();
                    _Kernel.updateDiskViewer();
                }else{
                    _StdOut.putText("Something Went Wrong setting up that proc.");
                    return false;
                }
               
            }
            
             
           
            
            return true;
        }

        public runProcess(pid): void{
           
            let tempPCB: TSOS.PCB   = _Scheduler.residentSet.get(parseInt(pid));
            if(tempPCB){ // if that pcb is there
                if(this.pcbLocSet.get(tempPCB.pid) == ON_DISK){
                    for(let p of _MemoryManager.segAllocStatus){
                        let pc = this.readyQueue.q.find(Pcb => Pcb.pid == p);
                        if(!pc){
                            pc = this.residentSet.get(p);
                        }
                        if(!pc){
                            console.log("Couldnt find that one");
                            return;
                        }
                        if(pc.status != RUNNING){
                            console.log("this pid"+ pc.pid);
                            _FileSystem.swapIn(tempPCB, pc);
                            break;
                        }
                    }
                    tempPCB.state = READY;
                    _Scheduler.readyQueue.enqueue(tempPCB);// in later projects, more will be added to this process
                    Control.hostLog("starting pid "+ pid);
                    _CPU.isExecuting = true;
                }else{
                    tempPCB.state = READY;
                    _Scheduler.readyQueue.enqueue(tempPCB);// in later projects, more will be added to this process
                    Control.hostLog("starting pid "+ pid);
                    _CPU.isExecuting = true;
                }
                
             
            }else{  // if cant find it
               _StdOut.putText("PCB with PID of " + pid + " was not found in the resident queue.");
                return;
            }
            
            this.residentSet.delete(parseInt(pid));
          
            _StdOut.advanceLine();
            _Kernel.updateProcViewer();
        }

        public termProc(pid: number){
            let seg = _MemoryManager.segAllocStatus.indexOf(pid); // finding where this pcb is in memory
            let tempPcb = new PCB(pid, seg*255, (seg+1)*255);
            tempPcb.state = TERMINATED;
            Control.hostLog("killed proc "+ pid);
            _MemoryManager.segAllocStatus[seg] = NOT_ALLOCATED; // freeing up the memory to be written over
            
            _Dispatcher.remPcb(); // pull out the running process
           
             _Kernel.updateProcViewer();
             console.log("terminating a thing" + pid);
            
        }

        public termRunningProc(pid: number): void{ // used by the Kill command
            let pCount = 0;
            let found = false;
            if(pid == this.runningPID){ // if we are trying to kill the running process
                _Dispatcher.remPcb();
                Control.hostLog("killed proc "+ pid);
                let seg = _MemoryManager.segAllocStatus.indexOf(pid);
                _MemoryManager.segAllocStatus[seg] = NOT_ALLOCATED;
                _Kernel.updateProcViewer();
                _StdOut.putText(`Process with pid ${pid} has been killed.`);
                _StdOut.advanceLine();
                return;
            }

            while(!found){ // iterate until you find it
                if(pCount >= _Scheduler.readyQueue.getSize()){ // it aint there
                    _StdOut.putText("Could not find a running process with PID "+ pid);
                    _StdOut.advanceLine();
                    return;
                }
                let tPcb = _Scheduler.readyQueue.dequeue();
                if(tPcb.pid == pid){        // found the proc
                    tPcb.state = TERMINATED;
                    _Scheduler.readyQueue.enqueue(tPcb);
                    found = true;
                    Control.hostLog("killed proc "+ pid);
                    let seg = _MemoryManager.segAllocStatus.indexOf(pid);
                     _MemoryManager.segAllocStatus[seg] = NOT_ALLOCATED;
                     _StdOut.putText(`Process with pid ${pid} has been killed.`);
                     _StdOut.advanceLine();
                     return ;
                }else{
                    pCount++;
                    _Scheduler.readyQueue.enqueue(tPcb);
                }
            }


        }

        public recessDuty(): void{ // keeping track of the round robin scheduling
           
            if(this.procTime.has(this.runningPID)){ // if there is a tracker for it
                let cQuantVal = this.procTime.get(this.runningPID);
                

                if(this.procTime.get(this.runningPID) >= this.quantum-1){
                   //finding if there is something to switch to
                    if(this.readyQueue.getSize() > 1){ // if there is more thna one thing in the queue
                        let foundNewProc = false;
                        let procCount = 0;
                        while(!foundNewProc){ // iterate until the last proc, or the first waiting/ready one
                            let tProc = this.readyQueue.dequeue();
                            if(tProc.state == READY){ // found one ready to go
                                console.log("in here");
                                this.procTime.set(this.runningPID,0);
                                _Dispatcher.contextSwitch(tProc);
                                tProc.state = RUNNING;
                                this.procTime.set(this.runningPID, 0);
                                break;
                            }else if(procCount == this.readyQueue.getSize()+1){ // nothing else ready
                                this.procTime.set(this.runningPID, 0);
                                 this.readyQueue.enqueue(tProc);
                                break;                         
                            }else{ // nothing interesting
                                this.readyQueue.enqueue(tProc);
                                procCount++;
                            }    
                        } 
                    }else{// if the current thing is the only thing in the ready queue
                        this.procTime.set(this.runningPID, 0);
                    }
                         
                }else{ // keep going
                    this.procTime.set(this.runningPID, ++cQuantVal);
                }

                
            }else if(this.runningPID == -1){ // if we get here, it means theres nothing running

                this.rrSync();
            }else{
                this.procTime.set(this.runningPID, 1);
            }          
        }

            // preemption code
        public rrSync(): void{
         
                let foundReady = false;
                
                let procCount = 0;
                while(!foundReady){ // see if theres something else to do next
                    let tProc = _Scheduler.readyQueue.dequeue();
                    if(tProc.state == READY){ // found something to do
                        let newProc = tProc;    
                        _Dispatcher.contextSwitch(newProc);
                        console.log("PID is now"+ this.runningPID);
                        foundReady = true;
                       
                    }else{ // nothing left to do
                        procCount++;
                        if(procCount >= this.readyQueue.getSize()+1){
                            console.log("I checked" + procCount);
                            _Scheduler.readyQueue.enqueue(tProc);
                            _CPU.isExecuting = false;
                            _KernelInterruptQueue.enqueue(new Interrupt(FINISHED_PROC_QUEUE, [_Scheduler.runningPID]));
                            break;
                        }
                        _Scheduler.readyQueue.enqueue(tProc);
                    }
                }
           }

        }

       
       
    }
