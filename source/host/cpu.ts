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

        constructor(public PC: number = 0,
                    public Acc: string = "00",
                    public Xreg: string = "00",
                    public Yreg: string = "00",
                    public IR: string = "00",
                    public Zflag: string = "00",
                    public isExecuting: boolean = false) {

        }

        public init(): void {
            this.PC = 0;
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
               this.updatePCBInfo();
         
          
        }
      
        public fetchDecodeExecute(): void{
            this.IR = _MemoryAccessor.readByte((this.PC).toString(16));
            switch(this.IR){
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
                    _Kernel.krnTrapError(`Something went wrong with execution, instruction:'${this.IR}'`);
                    //this.stopProc();
                    this.isExecuting = false;
            }
            
           
        }

        public updatePCBInfo(): void{
            document.getElementById("PC").innerHTML = this.PC.toString();
            document.getElementById("IR").innerHTML = this.IR;
            document.getElementById("ACC").innerHTML = this.Acc;
            document.getElementById("xReg").innerHTML = this.Xreg;
            document.getElementById("yReg").innerHTML = this.Yreg;
            document.getElementById("zFlg").innerHTML = this.Zflag;
        }
        public loadConst(): void{
            this.PC++;
           let constAddr16 = (this.PC).toString(16);
           this.Acc = _MemoryAccessor.readByte(constAddr16);
           
        } 


        public loadMem(){
           this.PC++;
            let memAddr16 = (this.PC).toString(16);
           this.PC++;
            let addr = _MemoryAccessor.readByte(memAddr16);
           
           this.Acc = _MemoryAccessor.readByte(addr);


        }


        public storeMem(){
            this.PC++;
            let storeAddr16 = (this.PC).toString(16);
            this.PC++;
             _MemoryAccessor.writeByte(storeAddr16, this.Acc);
             

        }

        public addWCarry(){
            this.PC++;
            let addr = _MemoryAccessor.readByte(this.PC);
            this.PC++;
            this.Acc = _MemoryAccessor.readByte(addr);

        }

        public loadXConst(){
            this.PC++;
            this.Xreg = _MemoryAccessor.readByte(this.PC);

        }

        public loadXMem(){
            this.PC++;
            let memAddr16 = (this.PC).toString(16);
           this.PC++;
            let addr = _MemoryAccessor.readByte(memAddr16);
           
           this.Xreg = _MemoryAccessor.readByte(addr);
        }
        public loadYConst(){
            this.PC++;
            this.Yreg = _MemoryAccessor.readByte(this.PC);
        }

        public loadYMem(){
            this.PC++;
            let memAddr16 = (this.PC).toString(16);
           this.PC++;
            let addr = _MemoryAccessor.readByte(memAddr16);
           
           this.Yreg = _MemoryAccessor.readByte(addr);
        }


        public compareX(){
            this.PC++;
            let addr = _MemoryAccessor.readByte(this.PC);
            this.PC++;
            if(_MemoryAccessor.readByte(this.PC) === this.Xreg){
                this.Zflag = "01";
            }else{
                this.Zflag = "00";
            }
        }

        public branchNBytes() {
            this.PC++;
            let bytes = _MemoryAccessor.readByte(this.PC);
            if (this.Zflag === "00"){
                this.PC += parseInt(bytes,16);
            }
               // handling the looping issue
            if (this.PC > MEM_LIMIT){
                let rem = this.PC % MEM_LIMIT;
                this.PC = rem;
            }
                
        }

        public incByte() {
           this.PC++;
            let addr = _MemoryAccessor.readByte(this.PC);
            this.PC++;
            let tempVal = _MemoryAccessor.readByte(addr);
            tempVal = (parseInt(tempVal,16) + 1).toString(16);
           
            _MemoryAccessor.writeByte(addr, tempVal);
        }
       
        public systemCall() {
            if (this.Xreg === "01") {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PRINT_YREG_IRQ, [this.Yreg]));
            }
            else if (this.Xreg === "01") {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PRINT_FROM_MEM_IRQ, [this.Yreg]));
            }
        }



















        public break(): void{
            _KernelInterruptQueue.enqueue(new Interrupt(END_PROC_IRQ, [_Scheduler.runningPID]));
        }
       
    }
}
