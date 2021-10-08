/*
MemoryAccessor for SamOS
used to allow the hardware of the system access the memory

*/

module TSOS{
    export class MemoryAccessor{
        
       constructor(){

       }
       public writeByte(addr, data): void{ // takes in hex, but uses base 10 in the actual memory
   
           addr = parseInt(addr, 16);

           _Memory.memSet[addr] = parseInt(data,16);
       }

       public readByte(addr16): string{ // takes in hex, but uses base 10 in the actual memory
        var addr10 = parseInt(addr16, 16);
        let res =  _Memory.memSet[addr10];
        if(res < 16){
            return ("0"+res.toString(16));
        }else{
            return res.toString(16);
        }
       }

       public loadBytes(dataList): void{
           _Memory.init();// *********************** THIS IS TEMPORARY UNTIL MULTI PROGRAM SUPPORT IS IMPLEMENTED ********************
           
           for(let i = 0; i< dataList.length;i++){ // starting at 0 until multi program support is implemented
                this.writeByte(dataList[i], i);
               
           }
       }
       


    }
}