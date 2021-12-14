/*
MemoryManager for SamOS
MemoryManager is responsible for communicating with the memory "device" through the operating system



*/



module TSOS{
    export class MemoryManager{
        
        /*
        *to keep track of allocation, had to do some odd stuff to not use too many variables.
        *Because we have to find a place to allocate memory before we can assign a PID, we cannot
        *look for a place in memory and assign a PID to that segment all in one go. So instead,
        *that segment is temporarily set from -2 (meaning no assinged pid) to -1 (meaning assigned, awaiting pid)
        *then the scheduler will talk to the memory manager and set the segment in question to the assigned PID once the PCB is created.
        *--edit: now same logic holds, but the -2 for not allocated and -1 for awaiting are constants
        *
        */
        
        public segAllocStatus = [NOT_ALLOCATED,NOT_ALLOCATED,NOT_ALLOCATED];
        public init(): void{
        
        }
        // making successive writeByte() calls to fill up memory with the new program
        public loadMemory(dataList): number{
            let segment = this.findOpenSegment();
            
            if(segment == -1){
                return -1;
            }
            // console.log("got all the way to here");
            var cAddr10 = 0;
            var cAddr16 = "00";
            for(let i = cAddr10; i< dataList.length;i++){
                 _MemoryAccessor.writeByteStrict(cAddr16, dataList[i].toUpperCase(), segment);
                 cAddr16 = (++cAddr10).toString(16);
                if(cAddr10<16){
                    cAddr16 = "0"+cAddr16;
                }
            }
            return segment;
        }

        public loadMemoryStrict(dataList, seg): void{
             // console.log("got all the way to here");
             var cAddr10 = 0;
             var cAddr16 = "00";
             console.log("got here " +seg);

             for(let i = cAddr10; i< dataList.length / 2;i++){
                    let nBit = dataList.substr(i*2,2).toUpperCase();
                    if(nBit == ""){
                        nBit = "00";
                    }
                  _MemoryAccessor.writeByteStrict(cAddr16, nBit, seg);
                  cAddr16 = (++cAddr10).toString(16);
                 if(cAddr10<16){
                     cAddr16 = "0"+cAddr16;
                 }
             }
            
        }

        public dumpFullSeg(segNum: number): string[]{
           
            // console.log("got all the way to here");
            console.log("WE ARE GETTING SEGMENT NUMBER" + segNum);
            var cAddr10 = 0;
            var cAddr16 = "00";
            let out = [];
            for(let i = cAddr10; i< MEM_LIMIT/3;i++){
                 out[out.length] =  _MemoryAccessor.readByteBySegment(cAddr16, segNum);
                 cAddr16 = (++cAddr10).toString(16);
                if(cAddr10<16){
                    cAddr16 = "0"+cAddr16;
                }
            }
            
            return out;
        }




        // not used much
        public clearMemory(){
           
            var cAddr10 = 0;
            var cAddr16 = "00";
            for(let i = cAddr10; i< MEM_LIMIT;i++){
                 _MemoryAccessor.writeByte(cAddr16, "00");
                 cAddr16 = (++cAddr10).toString(16);
                if(cAddr10<16){
                    cAddr16 = "0"+cAddr16;
                }
            }
        }
        public findOpenSegment(): number{
            if(this.segAllocStatus[0] == NOT_ALLOCATED){
                this.segAllocStatus[0] = ALLOC_AWAITING_PID;
                return 0;
            }else if(this.segAllocStatus[1] == NOT_ALLOCATED){
                this.segAllocStatus[1] = ALLOC_AWAITING_PID;
                return 1;

            }else if(this.segAllocStatus[2] == NOT_ALLOCATED){
                this.segAllocStatus[2] = ALLOC_AWAITING_PID;
                return 2;
            }else{
                return -1;
            }
        }

        public safeClearMem(): number[]{
            let clearedSegs = [];
            for(let i = 0;i<3;i++){
                    let tPid = _MemoryManager.segAllocStatus[i];
                if(tPid == _Scheduler.runningPID){
                    continue;
                }
                else if(tPid != -1 && tPid != -2){ // if its allocated
                    let inQueueInd = -1;

                    for(let n = 0;n<_Scheduler.readyQueue.q.length;n++){
                        if(_Scheduler.readyQueue.q[n].pid == tPid){
                            inQueueInd = n;
                        }
                    }

                    if((inQueueInd == -1)){ // if the allocated pid is not in the ready queue
                        clearedSegs[clearedSegs.length] = i;
                        this.clearMemoryPerSeg(i);
                        console.log("in111");
                        
                        
                    }else if(inQueueInd != -1){
                       let tPcb =   _Scheduler.readyQueue.q[inQueueInd];
                        if(tPcb.state == TERMINATED){   // if its in there but its terminated
                             clearedSegs[clearedSegs.length] = i;
                            this.clearMemoryPerSeg(i);
                            console.log("in222");
                       
                        }
                    }
                }else{ // if theres nothing in there
                    clearedSegs[clearedSegs.length] = i;
                    this.clearMemoryPerSeg(i);
                    console.log("in333");
                }
            }
            return clearedSegs;
        }
        
        // really only here so the kernel doesnt directly touch the memory accessor
        public getMemory(addr16): string{
            return _MemoryAccessor.readByte(addr16);
        } 
        public getMemoryStrict(addr16, pid): string{
            return _MemoryAccessor.readByteStrict(addr16,pid);
        } 
        public getMemoryPerSeg(addr16,seg): string{
            // // console.log("###"+seg);
            return _MemoryAccessor.readByteBySegment(addr16,seg);
        }

        public clearMemoryPerSeg(seg): void{
            for(let i = 0;i<256;i++){
                _MemoryAccessor.writeByteStrict(i.toString(16),"00",seg );
            }
        }
    }
}