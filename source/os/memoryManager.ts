/*
MemoryManager for SamOS
MemoryManager is responsible for communicating with the memory "device" through the operating system



*/



module TSOS{
    export class MemoryManager{
        public seg1Allocated: boolean = false;
        public seg2Allocated: boolean = false;
        public seg3Allocated: boolean = false;
        public init(): void{
        
        }
        // making successive writeByte() calls to fill up memory with the new program
        public loadMemory(dataList): number{
            let segment = this.findOpenSegment();
            if(segment == -1){
                return -1;
            }
          
            var cAddr10 = 0;
            var cAddr16 = "00";
            for(let i = cAddr10; i< dataList.length;i++){
                 _MemoryAccessor.writeByte(cAddr16, dataList[i].toUpperCase(),segment);
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
            if(!this.seg1Allocated){
                this.seg1Allocated = true;
                return 1;
            }else if(!this.seg2Allocated){
                this.seg2Allocated = true;
                return 2;

            }else if(!this.seg3Allocated){
                this.seg3Allocated = true;
                return 3;
            }else{
                return -1;
            }
        }

        // really only here so the kernel doesnt directly touch the memory accessor
        public getMemory(addr16): string{
            return _MemoryAccessor.readByte(addr16);
        } 
    }
}