/*
MemoryAccessor for SamOS
used to allow the hardware of the system access the memory

*/

module TSOS{
    export class MemoryAccessor{
        
       constructor(){

       }
       public writeByte(addr, data): void{ // takes in hex, but uses base 10 in the actual memory
            let cSeg = _MemoryManager.segAllocStatus.indexOf(_Scheduler.runningPID);
           let offset = (cSeg * 256);
           
           let physAddr = parseInt(addr, 16) + offset;
           let deviation = physAddr - offset;
           if(deviation  > 255 || deviation < 0){
                _KernelInterruptQueue.enqueue(new Interrupt(MEM_BOUNDS_ERR_W, [_Scheduler.runningPID, physAddr, deviation]));
                return;
           }

           _Memory.memSet[physAddr] = parseInt(data,16);
           
       }

       public writeByteStrict(addr, data, segment): void{
        let offset = (segment * 256);
        console.log(`we got segment ${segment} tp work with`);
        let physAddr = parseInt(addr, 16) + offset;
           let deviation = physAddr - offset;
           if(deviation  > 255 || deviation < 0){
            _KernelInterruptQueue.enqueue(new Interrupt(MEM_BOUNDS_ERR_W, [_Scheduler.runningPID, physAddr, deviation]));
            return;
       }

           _Memory.memSet[physAddr] = parseInt(data,16);
        
       }
       public readByte(addr16): string{ // takes in hex, but uses base 10 in the actual memory
        let cSeg = _MemoryManager.segAllocStatus.indexOf(_Scheduler.runningPID);
        console.log("1seg"+cSeg);
        let offset = (cSeg * 256);
       let physAddr = parseInt(addr16, 16) + offset;
       console.log("PA:"+ physAddr);
           let deviation = physAddr - offset;
           if(deviation  > 255 || deviation < 0){
            _KernelInterruptQueue.enqueue(new Interrupt(MEM_BOUNDS_ERR_R, [_Scheduler.runningPID, physAddr, deviation]));
            return "FF";
       }
        let res =  _Memory.memSet[physAddr];
        if(res < 16){
            return ("0"+res.toString(16));
        }else{
            return res.toString(16);
        }
       }

       public readByteStrict(addr16, pid): string{
        let cSeg = _MemoryManager.segAllocStatus.indexOf(pid);
        console.log("2seg"+cSeg);
        let offset = (cSeg * 256);
       let physAddr = parseInt(addr16, 16) + offset;
       console.log("PA:"+ physAddr);
           let deviation = physAddr - offset;
           if(deviation  > 255 || deviation < 0){
            _KernelInterruptQueue.enqueue(new Interrupt(MEM_BOUNDS_ERR_R, [_Scheduler.runningPID, physAddr, deviation]));
            return "FF";
       }
        let res =  _Memory.memSet[physAddr];
        if(res < 16){
            return ("0"+res.toString(16));
        }else{
            return res.toString(16);
        }
       }
      
       


    }
}