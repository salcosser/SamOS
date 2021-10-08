/*
MemoryManager for SamOS
MemoryManager is responsible for communicating with the memory "device" through the operating system



*/



module TSOS{
    export class MemoryManager{
        public init(): void{
        
        }
        // making successive writeByte() calls to fill up memory with the new program
        public loadMemory(dataList): void{
          
            var addr = "00" // for now, until we are doing multiple programs
            var cAddr10 = 0;
            var cAddr16 = "00";
            for(let i = cAddr10; i< dataList.length;i++){
                 _MemoryAccessor.writeByte(cAddr16, dataList[i].toUpperCase());
                 cAddr16 = (++cAddr10).toString(16);
                if(cAddr10<16){
                    cAddr16 = "0"+cAddr16;
                }
            }
            
        }
        // not used much
        public clearMemory(){
            var addr = "00" // for now, until we are doing multiple programs
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


        // really only here so the kernel doesnt directly touch the memory accessor
        public getMemory(addr16): string{
            return _MemoryAccessor.readByte(addr16);
        } 
    }
}