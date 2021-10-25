/*
MemoryAccessor for SamOS
used to allow the hardware of the system access the memory

*/

module TSOS{
    export class MemoryAccessor{
        
       constructor(){

       }
       public writeByte(addr, data): boolean{ // takes in hex, but uses base 10 in the actual memory
            let cSeg = _MemoryManager.segAllocStatus.indexOf(_Scheduler.runningPID);
           let offset = (cSeg * 256);
           
           let physAddr = parseInt(addr, 16) + offset;
           let deviation = physAddr - offset;
           if(deviation  > 255 || deviation < 0){
               return false;
           }

           _Memory.memSet[physAddr] = parseInt(data,16);
           return true;
       }

       public writeByteStrict(addr, data, segment): boolean{
        let offset = (segment * 256);
        let physAddr = parseInt(addr, 16) + offset;
           let deviation = physAddr - offset;
           if(deviation  > 255 || deviation < 0){
               return false;
           }

           _Memory.memSet[physAddr] = parseInt(data,16);
        return true;
       }
       public readByte(addr16): string{ // takes in hex, but uses base 10 in the actual memory
        let cSeg = _MemoryManager.segAllocStatus.indexOf(_Scheduler.runningPID);
        let offset = (cSeg * 256);
       let physAddr = parseInt(addr16, 16) + offset;
           let deviation = physAddr - offset;
           if(deviation  > 255 || deviation < 0){
               return "ZZ";
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