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
            console.log("got all the way to here");
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

        
        // really only here so the kernel doesnt directly touch the memory accessor
        public getMemory(addr16): string{
            return _MemoryAccessor.readByte(addr16);
        } 
        public getMemoryStrict(addr16, pid): string{
            return _MemoryAccessor.readByteStrict(addr16,pid);
        } 
        public getMemoryPerSeg(addr16,seg): string{
            // console.log("###"+seg);
            return _MemoryAccessor.readByteBySegment(addr16,seg);
        }
    }
}