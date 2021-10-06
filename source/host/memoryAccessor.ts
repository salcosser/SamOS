module TSOS{
    export class MemoryAccessor{
        //code
       constructor(){

       }
       public writeByte(addr, data): void{ // takes in hex, but uses base 10 in the actual memory
   
           addr = parseInt(addr, 16);

           _Memory.memSet[addr] = data;
       }

       public readByte(addr16): number{ // takes in hex, but uses base 10 in the actual memory
        var addr10 = parseInt(addr16, 16);
        return _Memory.memSet[addr10];
       }

       public loadBytes(dataList): void{
           _Memory.init();// *********************** THIS IS TEMPORARY UNTIL MULTI PROGRAM SUPPORT IS IMPLEMENTED ********************
           
           for(let i = 0; i< dataList.length;i++){ // starting at 0 until multi program support is implemented
                this.writeByte(dataList[i], i);
               
           }
       }
       


    }
}