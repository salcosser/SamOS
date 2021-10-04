module TSOS{
    export class MemoryAccessor{
        //code
       constructor(){

       }
       public writeByte(addr, data): void{
           if(parseInt(data,16) < 16){
               data = "0"+data;
           }
           addr = parseInt(addr, 16);
           _Memory.memSet[addr] = data;
       }

       public readByte(addr16): string{
        var addr10 = parseInt(addr16, 16);
        return _Memory.memSet[addr10];
       }

       public loadBytes(dataList): void{
           _Memory.init();// *********************** THIS IS TEMPORARY UNTIL MULTI PROGRAM SUPPORT IS IMPLEMENTED ********************
           var addr = "00" // for now, until we are doing multiple programs
           var cAddr10 = parseInt(addr, 16);
           var cAddr16 = addr;
           for(let i = cAddr10; i< dataList.length;i++){
                this.writeByte(dataList[i], cAddr16);
                cAddr16 = (++cAddr10).toString(16);
                if(cAddr10<16){
                    cAddr16 = "0"+cAddr16;
                }
           }
       }
       


    }
}