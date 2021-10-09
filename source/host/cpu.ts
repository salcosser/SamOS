/* ------------
     CPU.ts

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Cpu {
        public cnt = 0;
        constructor(public PC: string = "00",
                    public Acc: string = "00",
                    public Xreg: string = "00",
                    public Yreg: string = "00",
                    public IR: string = "00",
                    public Zflag: string = "00",
                    public isExecuting: boolean = false) {

        }

        public init(): void {
            this.PC = "00";
            this.Acc = "00";
            this.Xreg = "00";
            this.Yreg = "00";
            this.Zflag = "00";
            this.isExecuting = false;
        }

        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
          
               this.fetchDecodeExecute();
              
         
          
        }
      
        public fetchDecodeExecute(): void{


            // the fetch part of the cycle
            _CPU.IR = _MemoryAccessor.readByte(_CPU.PC).toUpperCase(); // normalizing the IR in case memory was not updated in upper case
            console.log("cnt: "+ ++this.cnt + " | instruction: " + this.IR + " | pc "+ this.PC + " | acc:" + this.Acc + " | y:" + this.Yreg + " | x:" + this.Xreg + " | z:" + this.Zflag);
            switch(this.IR){ // the decode part of the cycle
                case "A9":
                    this.loadConst();
                    break;
                case "AD":
                    this.loadMem();
                    break;
                case "8D":
                    this.storeMem();
                    break;
                case "6D":
                    this.addWCarry();
                    break;
                case "A2":
                    this.loadXConst();
                    break;
                case "AE":
                    this.loadXMem();
                    break;
                case "A0":
                    this.loadYConst();
                    break;
                case "AC":
                    this.loadYMem();
                    break;
                case "EA": // no op
                    _CPU.incProgCnt();
                    break;
                case "00":
                    this.break();
                    this.isExecuting = false;
                    break;
                case "EC":
                    this.compareX();
                    break;
                case "D0":
                    this.branchNBytes();
                    break;
                case "EE":
                    this.incByte();
                    break;
                case "FF":
                    this.systemCall();
                    break;
                default:
                    _Kernel.krnTrapError(`Something went wrong with execution, instruction:'${this.IR}' at memory address ${this.PC}`);
                    this.isExecuting = false;
                    break;
            }
           
           
        }


        // used to increment the program counter in hex
        public incProgCnt(){ 
            _CPU.PC = (parseInt(_CPU.PC, 16) + 1).toString(16).toUpperCase();
           
        }
        // used to update the status linees
     

        //loads a constant into the accumulator
        public loadConst(): void{
           
           let constAddr16 = (parseInt((this.PC),16) + 1).toString(16);
           this.Acc = _MemoryAccessor.readByte(constAddr16).toUpperCase();
           _CPU.incProgCnt();
           _CPU.incProgCnt();
        } 

        //loads a value from a specified memory address into the accumulator
        public loadMem(){
          
           
          
           let addr = parseInt((_MemoryAccessor.readByte((parseInt(this.PC,16)+2).toString(16)) + _MemoryAccessor.readByte((parseInt(this.PC,16)+1).toString(16))),16);
           this.Acc = _MemoryAccessor.readByte(addr.toString(16)).toUpperCase();
           _CPU.incProgCnt();
           _CPU.incProgCnt();
          

        }

        //writes the value currently in the accumulator into a specified address in memory
        public storeMem(){
            
           
           
           let addr = parseInt((_MemoryAccessor.readByte((parseInt(this.PC,16)+2).toString(16)) + _MemoryAccessor.readByte((parseInt(this.PC,16)+1).toString(16))),16);
             
            //addr = parseInt(_MemoryAccessor.readByte(this.PC) + addr,16).toString(16);
             _MemoryAccessor.writeByte(addr.toString(16), this.Acc);
            
             _CPU.incProgCnt();
             _CPU.incProgCnt();
             _CPU.incProgCnt();
           

        }
        // sets the accumulator equal to (<current accumulator value> + <value in specifed memory address>)
        public addWCarry(){
           
         
            let addr = parseInt((_MemoryAccessor.readByte((parseInt(this.PC,16)+2).toString(16)) + _MemoryAccessor.readByte((parseInt(this.PC,16)+1).toString(16))),16);
            let value = _MemoryAccessor.readByte(addr.toString(16));
            this.Acc = (parseInt(this.Acc, 16) + parseInt(value,16)).toString(16);
            _CPU.incProgCnt();
            _CPU.incProgCnt();
            _CPU.incProgCnt();

        }
        //puts a specified value into the x register
        public loadXConst(){
           
            _CPU.incProgCnt();
            this.Xreg = _MemoryAccessor.readByte(this.PC);
            _CPU.incProgCnt();
        }
        // puts the value in a certain memory address into the x register
        public loadXMem(){
            
            
            let addr = parseInt((_MemoryAccessor.readByte((parseInt(this.PC,16)+2).toString(16)) + _MemoryAccessor.readByte((parseInt(this.PC,16)+1).toString(16))),16).toString(16);
          
           this.Xreg = _MemoryAccessor.readByte(addr);
           _CPU.incProgCnt();
           _CPU.incProgCnt();
           _CPU.incProgCnt();
        } 
         //puts a specified value into the y register
        public loadYConst(){
           
            this.Yreg = _MemoryAccessor.readByte((parseInt(this.PC,16)+1).toString(16));
            _CPU.incProgCnt();
            _CPU.incProgCnt();
        }
        // puts the value in a certain memory address into the y register
        public loadYMem(){
            
           
           
            let addr = parseInt((_MemoryAccessor.readByte((parseInt(this.PC,16)+2).toString(16)) + _MemoryAccessor.readByte((parseInt(this.PC,16)+1).toString(16))),16);
          
           this.Yreg = _MemoryAccessor.readByte(addr.toString(16));
           _CPU.incProgCnt();
           _CPU.incProgCnt();
           _CPU.incProgCnt();
        }

        //checks if the value in a specified memory address is equal to the value currently in the x register, and sets the z flag if so
        public compareX(){
           

            let addr = parseInt((_MemoryAccessor.readByte((parseInt(this.PC,16)+2).toString(16)) + _MemoryAccessor.readByte((parseInt(this.PC,16)+1).toString(16))),16);
           
            
            if(_MemoryAccessor.readByte(addr.toString(16)).toUpperCase() === this.Xreg.toUpperCase()){
                this.Zflag = "01";
            }else{
                this.Zflag = "00";
            }
            _CPU.incProgCnt();
            _CPU.incProgCnt();
            _CPU.incProgCnt();
            
        }
        //branches the current execution by a number of bytes specified within a given memory address, while accounting for the memory limit
        public branchNBytes() {
            
            let bytes = parseInt(_MemoryAccessor.readByte((parseInt(this.PC,16)+1).toString(16)),16);
            if (this.Zflag === "00"){
                this.incProgCnt();
                this.PC = (parseInt(this.PC,16) + bytes).toString(16);
                
                if (parseInt(this.PC,16) > MEM_LIMIT-1){
                    let rem = parseInt(this.PC,16) % (MEM_LIMIT-1);
                    this.PC = rem.toString(16);

                }else{
                    this.incProgCnt();
                }
                
               
            console.log("Branched " +bytes+ " bytes to " + this.PC);
            
            }else{
                console.log("skipped branch");
                _CPU.incProgCnt();
                _CPU.incProgCnt();
            }
               // handling the looping issue
            
            
                
        }
        //increments a value in a specified memory addresss
        public incByte() {
          
           
           let addr = parseInt((_MemoryAccessor.readByte((parseInt(this.PC,16)+2).toString(16)) + _MemoryAccessor.readByte((parseInt(this.PC,16)+1).toString(16))),16);
            
            let tempVal = parseInt(_MemoryAccessor.readByte(addr.toString(16)),16);
            tempVal++;
           
            _MemoryAccessor.writeByte(addr.toString(16), tempVal.toString(16));
           
            _CPU.incProgCnt();
            _CPU.incProgCnt();
            _CPU.incProgCnt();
        }
       // handling system calls
        public systemCall() {
            if (this.Xreg === "01") {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PRINT_YREG_IRQ, [this.Yreg]));
            }
            else if (this.Xreg === "02") {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PRINT_FROM_MEM_IRQ, [this.Yreg]));
            }
            _CPU.incProgCnt();
        }


















        // tells the kernel to end execution
        public break(): void{
            
            _KernelInterruptQueue.enqueue(new Interrupt(END_PROC_IRQ, [_Scheduler.runningPID]));
        }
       
    }
}
