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
      
        
        public runningPID: number = -1;
        public quantum: number = 6;
        public cQuant: number = -1;
        public procTime = new Map();

        constructor(){
           // this.readyQueue = new Queue();
        }
        init(){
            
        }
        public setupProcess(inputCode): boolean{
            while(inputCode.length < 256){
                inputCode[inputCode.length] = "00";
            }
            let loadedSeg = _MemoryManager.loadMemory(inputCode);
            if(loadedSeg == -1){
                return false;
            }
            // let nSpot = _MemoryManager.segAllocStatus.indexOf(ALLOC_AWAITING_PID);
             _MemoryManager.segAllocStatus[loadedSeg] = _Scheduler.pid;
           // // console.log(`I assigned ${this.pid} to seg ${loadedSeg}: proof- seg:${_MemoryManager.segAllocStatus[loadedSeg]}`);
            let base = (loadedSeg * 256);
            let memEnd = (inputCode.length).toString(16);
            let newPcb = new PCB(_Scheduler.pid,base, base+ 255);
           // _MemoryManager.segAllocStatus[loadedSeg] = _Scheduler.pid;
            _StdOut.putText(`Loaded new program, PID ${_Scheduler.pid}`);
            _StdOut.advanceLine();
            _Scheduler.residentSet.set(_Scheduler.pid, newPcb);
            _Scheduler.pid++;
            _Kernel.updateProcViewer();
            return true;
        }

        public runProcess(pid): void{
           
            let tempPCB: TSOS.PCB   = _Scheduler.residentSet.get(parseInt(pid));
            if(tempPCB){
                
                tempPCB.state = READY;
                _Scheduler.readyQueue.enqueue(tempPCB);// in later projects, more will be added to this process
                _CPU.isExecuting = true;
             
            }else{
               _StdOut.putText("PCB with PID of " + pid + " was not found in the resident queue.");
                return;
            }
            // console.log(_Scheduler.readyQueue.getSize() + ":>> size of ready queue now.");
            this.residentSet.delete(parseInt(pid));
            _StdOut.putText(`PID ${pid[0]} has started.`);
            _StdOut.advanceLine();
            _Kernel.updateProcViewer();
        }

        public termProc(pid: number){
            let seg = _MemoryManager.segAllocStatus.indexOf(pid);
            let tempPcb = new PCB(pid, seg*255, (seg+1)*255);
            tempPcb.state = TERMINATED;
            _MemoryManager.segAllocStatus[seg] = NOT_ALLOCATED;
            // console.log(`Mm seg ${seg} set to ${_MemoryManager.segAllocStatus[seg]}`);
            _Dispatcher.remPcb();
            //_Scheduler.readyQueue.enqueue(tempPcb);
             _Kernel.updateProcViewer();
             console.log("terminating a thing" + pid);
            // console.log("lets see if theres anything else");
           // this.rrSync();
        }

        public recessDuty(): void{ // keeping track of the round robin scheduling
           // console.log("recTime");
            if(this.procTime.has(this.runningPID)){
                let cQuantVal = this.procTime.get(this.runningPID);
                // console.log("I got in here");

                if(this.procTime.get(this.runningPID) == this.quantum-1){
                   //finding if there is something to switch to
                    if(this.readyQueue.getSize() > 1){
                        let foundNewProc = false;
                        let procCount = 0;
                        while(!foundNewProc){
                            let tProc = this.readyQueue.dequeue();
                            if(tProc.state == READY || tProc.state == WAITING){
                                console.log("in here");
                                this.procTime.set(this.runningPID,0);
                                _Dispatcher.contextSwitch(tProc);
                                tProc.state = RUNNING;
                                this.procTime.set(this.runningPID, 0);
                                break;
                            }else if(procCount == this.readyQueue.getSize()+1){
                                this.procTime.set(this.runningPID, 0);
                              //  console.log("beep boop should be 3: "+ procCount);
                                 this.readyQueue.enqueue(tProc);
                              //  _KernelInterruptQueue.enqueue(new Interrupt(FINISHED_PROC_QUEUE, [_Scheduler.runningPID]));
                                break;                         
                            }else{
                                this.readyQueue.enqueue(tProc);
                                procCount++;
                            }    
                        } 
                    }else{
                        this.procTime.set(this.runningPID, 0);
                    }
                         
                }else{
                    this.procTime.set(this.runningPID, ++cQuantVal);
                }

                
            }else if(this.runningPID == -1){

                this.rrSync();
            }else{
                this.procTime.set(this.runningPID, 1);
            }          
        }
            // code to handle what happens when a program terminates
        public rrSync(): void{
         
                let foundReady = false;
                
                let procCount = 0;
                while(!foundReady){
                    let tProc = _Scheduler.readyQueue.dequeue();
                    if(tProc.state == READY || tProc.state == WAITING){
                        let newProc = tProc;
                        // console.log("switching to "+ newProc.pid);
                        _Dispatcher.contextSwitch(newProc);
                        console.log("PID is now"+ this.runningPID);
                        console.log("doing this now");
                        // console.log("Current PID is now: "+ this.runningPID);
                        foundReady = true;
                       // this.recessDuty();
                       
                    }else{
                        procCount++;
                        console.log("33k33k33");
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
