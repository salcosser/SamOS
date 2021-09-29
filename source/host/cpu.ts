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
        public fetch(): string{
            var rowOffset = this.PC % 8;
            var row = ((this.PC - rowOffset) / 8) - 1;
            var currentInstruction = document.getElementById("memTableRows").getElementsByTagName("tr")[row].cells[rowOffset+1].innerHTML;
            return currentInstruction;
        }
        public fetchDecodeExecute(): void{
            this.IR = _MemoryAccessor.readByte((this.PC).toString(16));
            switch(this.IR){
                case "A9":
                    this.loadConst();
                    break;
                case "00":
                    this.break();
                    break;
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
           var constAddr16 = (this.PC + 1).toString(16);
           this.Acc = _MemoryAccessor.readByte(constAddr16);
           this.PC++;
           this.PC++;
        } 
        public break(): void{
            _KernelInterruptQueue.enqueue(new Interrupt(END_PROC_IRQ, [_Scheduler.readyPCB.pid]));
        }
       
    }
}
