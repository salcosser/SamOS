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
        public cAlgo = RR;
        public priArr = [];
        public pendingSwitch = false;
        constructor(){
          
        }
        init(){
            
        }

        public sortPri(prObj1, prObj2){ // priority sorting algorithm
            if(prObj1.pri > prObj2.pri){
                return 1;
            }else if(prObj1.pri< prObj2.pri){
                return -1;
            }else if(prObj1.arrive != Number.POSITIVE_INFINITY && prObj2.arrive != Number.POSITIVE_INFINITY){
                if(prObj1.arrive < prObj2.arrive){
                    return 1;
                }else{
                    return -1;
                }
            }else{
                if(prObj1.pid < prObj2.pid){
                    return 1;
                }else{
                    return -1;
                }
            }
        }

        public updatePriorityArray(){ // sorting the priority array so we can just iterate through it
            this.priArr = this.priArr.sort((a,b) => this.sortPri(a,b));
        }

        public setupProcess(inputCode, priority): number{ 

            while(inputCode.length < 256){
                inputCode[inputCode.length] = "00";
            }
            let lPid = -1;
            let loadedSeg = _MemoryManager.loadMemory(inputCode);
            
            
            
            if(loadedSeg != -1){
               
               _MemoryManager.segAllocStatus[loadedSeg] = _Scheduler.pid;
        
               let base = (loadedSeg * 256);
               let memEnd = (inputCode.length).toString(16);
               let newPcb = new PCB(_Scheduler.pid,base, base+ 255);
               _StdOut.putText(`Loaded new program, PID ${_Scheduler.pid}`);
               _StdOut.advanceLine();
               _Scheduler.residentSet.set(_Scheduler.pid, newPcb);// not ready yet
               this.pcbLocSet.set(_Scheduler.pid, IN_MEM);
               //console.log("&&&&&");
               lPid = _Scheduler.pid;

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
                    //console.log("&&^^&&&");
                    lPid = _Scheduler.pid;
                    _Scheduler.pid++;
                    _Kernel.updateProcViewer();
                    _Kernel.updateDiskViewer();
                }else{
                    _StdOut.putText("Something Went Wrong setting up that proc.");
                    //return lPid;
                }
               
            }
            
             
           if(priority != -1){
               this.priArr[this.priArr.length] = {pid: lPid,pri:  priority, arrive: Number.POSITIVE_INFINITY};
               
           }else{
                this.priArr[this.priArr.length] = {pid: lPid,pri:  DEFAULT_PRIORITY, arrive: Number.POSITIVE_INFINITY};
           }
            this.updatePriorityArray();
            return lPid;
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
                            //console.log("Couldnt find that one");
                            return;
                        }
                        //console.log("pc: "+ this.pcbLocSet.get(pc.pid));
                        if(pc.state != RUNNING && pc.state != TERMINATED && this.pcbLocSet.get(pc.pid) == IN_MEM){
                            //console.log("this pid"+ pc.pid);
                            _FileSystem.swapIn(tempPCB, pc);
                            break;
                        }

                    }
                    tempPCB.state = READY;
                    for(let i = 0;i<this.priArr.length;i++){
                        if(this.priArr[i].pid == pid){
                            this.priArr[i].arrive = _OSclock;
                            break;
                        }
                    }
                    _Scheduler.readyQueue.enqueue(tempPCB);// in later projects, more will be added to this process
                    this.setTimeStamp(tempPCB.pid);
                    Control.hostLog("starting pid "+ pid);
                    _CPU.isExecuting = true;
                }else{
                    tempPCB.state = READY;
                    _Scheduler.readyQueue.enqueue(tempPCB);// in later projects, more will be added to this process
                    this.setTimeStamp(tempPCB.pid);
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
            this.pendingSwitch = true;
            let seg = _MemoryManager.segAllocStatus.indexOf(pid); // finding where this pcb is in memory
            let tempPcb = new PCB(pid, seg*255, (seg+1)*255);
            tempPcb.state = TERMINATED;
           /// this.readyQueue.enqueue(tempPcb);
            Control.hostLog("killed proc "+ pid);
            _MemoryManager.segAllocStatus[seg] = NOT_ALLOCATED; // freeing up the memory to be written over
            
            _Dispatcher.remPcb(); // pull out the running process
           
             _Kernel.updateProcViewer();
             //console.log("terminating a thing" + pid);
            
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
                    this.setToPosInf(pid);
                    _Scheduler.readyQueue.enqueue(tPcb);
                    found = true;
                    Control.hostLog("killed proc "+ pid);
                    if(this.pcbLocSet.get(pid)== IN_MEM){ // clearing it out depending on where it is
                        let seg = _MemoryManager.segAllocStatus.indexOf(pid);
                        _MemoryManager.segAllocStatus[seg] = NOT_ALLOCATED;
                    }else{
                        this.deleteFromDisk(pid);
                    }
                   
                     _StdOut.putText(`Process with pid ${pid} has been killed.`);
                     _StdOut.advanceLine();
                     return ;
                }else{
                    pCount++;
                    _Scheduler.readyQueue.enqueue(tPcb);
                }
            }


        }

        public preemptive(): void{ // keeping track of the round robin scheduling
           
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
                               
                                this.procTime.set(this.runningPID,0);
                                // check if it is on disk
                                let nProcLoc = this.pcbLocSet.get(tProc.pid);
                                if(nProcLoc == ON_DISK){
                                    
                                    
                                    let triedSwap = this.ensureInMemory(tProc);
                                    
                                }
                                
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

                this.sync();
            }else{
                this.procTime.set(this.runningPID, 1);
            }          
        }


        






            // preemption code
        public sync(): void{
         
                let foundReady = false;
                
                let procCount = 0;
                while(!foundReady){ // see if theres something else to do next
                    console.log("proc count"+ procCount);
                    let tProc = _Scheduler.readyQueue.dequeue();
                    if(tProc.state == READY){ // found something to do
                        let newProc = tProc;    
                        let triedSwap = this.ensureInMemory(tProc); // ensure that the thing is in memory
                        //if(_MemoryManager.segAllocS)
                        _Dispatcher.contextSwitch(newProc);
                        //console.log("PID is now"+ this.runningPID);
                        foundReady = true;
                       
                    }else{ // nothing left to do
                        procCount++;
                        if(procCount >= this.readyQueue.getSize()+1){
                            //console.log("I checked" + procCount);
                            _Scheduler.readyQueue.enqueue(tProc);
                            _CPU.isExecuting = false;
                            _KernelInterruptQueue.enqueue(new Interrupt(FINISHED_PROC_QUEUE, [_Scheduler.runningPID]));
                            break;
                        }
                        _Scheduler.readyQueue.enqueue(tProc);
                    }
                }
           }

        public priority(){ // priority scheduling

            if(this.runningPID == -1){
                this.priSync(); // call switcher
                
            
            }else{
                if(this.pendingSwitch){
                
                    this.priSync();
                    this.pendingSwitch = false;
                }else if(this.runningPID == 0){
                    
                }
            }

            

        }


     
        
        public priSync(){
            for(let i = 0;i<this.priArr.length;i++){
                let pc = this.priArr[i];
                if(pc.pri != Number.POSITIVE_INFINITY){ // find something that isnt terminated
                    let tProc = this.readyQueue.dequeue();
                    if(tProc.pid == pc.pri){ // if we found the right proc at the first index
                        if(tProc.state ==READY){
                            let nProcLoc = this.pcbLocSet.get(tProc.pid);
                            let triedSwap = this.ensureInMemory(tProc); // ensure it is in memory before context switching to it
                            _Dispatcher.contextSwitch(tProc);
                            _Scheduler.pendingSwitch = false;
                            return;
                        }
                        
                    }else{
                        this.readyQueue.enqueue(tProc);
                        let found = false;
                        let pCount = 1;
                        while(!found){ // iterate over the readyQueue until you get to a good candidate
                            tProc = this.readyQueue.dequeue();
                            if(tProc.pid == pc.pid && tProc.state == READY){
                                let triedSwap = this.ensureInMemory(tProc); // ensure it is in memory before context switching to it
                                _Dispatcher.contextSwitch(tProc);
                                _Scheduler.pendingSwitch = false;
                                return;
                            }else if(pCount >= this.readyQueue.getSize()+1){
                                this.readyQueue.enqueue(tProc);

                                break;
                            }else{
                                this.readyQueue.enqueue(tProc);
                                pCount++;
                            }
                        }
                    }
                    
                    
                }
            }
            _CPU.isExecuting = false;
            _KernelInterruptQueue.enqueue(new Interrupt(FINISHED_PROC_QUEUE, [_Scheduler.runningPID]));
        }
        public ensureInMemory(pcb): boolean{ // used to make sure that the thing about to be used is actually in memory, and if not, swapping to it
            let nProcLoc = this.pcbLocSet.get(pcb.pid);
            if(nProcLoc == ON_DISK){
                for(let i = 0; i<_MemoryManager.segAllocStatus.length;i++){
                    let p = _MemoryManager.segAllocStatus[i];
                    if(p == _Scheduler.runningPID){
                        continue;
                    }else if(p < 0){
                        _FileSystem.onlySwapIn(pcb, i);
                        
                        return true;
                        //swap in without putting something back
                    }else{
                       // find something old to swap out
                        let oPcb = this.readyQueue.q.find(oldPcb=> oldPcb.pid == p);
                        if(oPcb.state != RUNNING){
                            _FileSystem.swapIn(pcb,oPcb);
                           
                            return true;
                        }
                    }
                }
            }
           
            return false;
        }

        public deleteFromDisk(pcb){
            _FileSystem.deleteSwpFile(pcb.pid);
        }
    
        public setToPosInf(PID: number){ // effectivley making it unviewable
            for(let i = 0;i<_Scheduler.priArr.length;i++){
                if(_Scheduler.priArr[i].pid == PID){
                    _Scheduler.priArr[i].pri = Number.POSITIVE_INFINITY;
                    _Scheduler.updatePriorityArray();
                    //console.log("got to here");
                    break;
                }
            }
        }

        public setTimeStamp(PID: number){ // used to break ties with fcfs
            for(let i = 0;i<_Scheduler.priArr.length;i++){
                if(_Scheduler.priArr[i].pid == PID){
                    _Scheduler.priArr[i].arrive = _OSclock;
                    _Scheduler.updatePriorityArray();
                    //console.log("got to here");
                    break;
                }
            }
        }


    }

  



        
       
       
    }
