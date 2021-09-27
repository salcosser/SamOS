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
var TSOS;
(function (TSOS) {
    class Cpu {
        constructor(PC = 0, Acc = 0, Xreg = 0, Yreg = 0, Zflag = 0, isExecuting = false) {
            this.PC = PC;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.isExecuting = isExecuting;
        }
        init() {
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }
        cycle() {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            this.PC = parseInt(document.getElementById("PC").innerHTML, 16);
            var currentInstruction = this.fetch();
            this.decodeAndExecute(currentInstruction);
        }
        fetch() {
            var rowOffset = this.PC % 8;
            var row = ((this.PC - rowOffset) / 8) - 1;
            var currentInstruction = document.getElementById("memTableRows").getElementsByTagName("tr")[row].cells[rowOffset + 1].innerHTML;
            return currentInstruction;
        }
        decodeAndExecute(instruction) {
            // switch(instruction){
            //     case "A9": // LDA constant
            //         var constOffset = (this.PC+1) % 8;
            //         var constRow = (((this.PC+1) - constOffset) / 8) - 1;
            //         var constVal = document.getElementById("memTableRows").getElementsByTagName("tr")[constRow].cells[constOffset+1].innerHTML;
            //         document.getElementById("ACC").innerHTML =  constVal;
            //         break;
            //     case "AD":
            //         var 
            // }
        }
    }
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=cpu.js.map