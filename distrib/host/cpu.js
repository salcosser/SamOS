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
        constructor(PC = "00", Acc = "00", Xreg = "00", Yreg = "00", IR = "00", Zflag = "00", isExecuting = false) {
            this.PC = PC;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.IR = IR;
            this.Zflag = Zflag;
            this.isExecuting = isExecuting;
            this.cnt = 0;
        }
        init() {
            this.PC = "00";
            this.Acc = "00";
            this.Xreg = "00";
            this.Yreg = "00";
            this.Zflag = "00";
            this.isExecuting = false;
        }
        cycle() {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            this.fetchDecodeExecute();
            this.updatePCBInfo();
        }
        fetchDecodeExecute() {
            _CPU.IR = _MemoryAccessor.readByte(_CPU.PC).toString(16).toUpperCase();
            if (parseInt(_CPU.IR, 16) < 16) {
                _CPU.IR = "0" + _CPU.IR;
            }
            console.log("cnt: " + ++this.cnt + "instruction: " + this.IR + "pc " + this.PC + "acc:" + this.Acc + " y:" + this.Yreg + " x:" + this.Xreg + "z:" + this.Zflag);
            switch (this.IR) {
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
                    console.log("did the thing");
                    break;
                case "AC":
                    this.loadYMem();
                    console.log("did the other thing");
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
            this.updatePCBInfo();
        }
        incProgCnt() {
            _CPU.PC = (parseInt(_CPU.PC, 16) + 1).toString(16).toUpperCase();
            this.updatePCBInfo();
        }
        updatePCBInfo() {
            document.getElementById("PC").innerHTML = this.PC;
            document.getElementById("IR").innerHTML = this.IR;
            document.getElementById("ACC").innerHTML = this.Acc;
            document.getElementById("xReg").innerHTML = this.Xreg;
            document.getElementById("yReg").innerHTML = this.Yreg;
            document.getElementById("zFlg").innerHTML = this.Zflag;
        }
        loadConst() {
            _CPU.incProgCnt();
            // let constAddr16 = (this.PC).toString(16);
            this.Acc = _MemoryAccessor.readByte(this.PC);
            _CPU.incProgCnt();
        }
        loadMem() {
            _CPU.incProgCnt();
            // let memAddr16 = (this.PC).toString(16);
            let addr = parseInt((_MemoryAccessor.readByte(this.PC + 1) + _MemoryAccessor.readByte(this.PC)), 16).toString(16);
            this.Acc = _MemoryAccessor.readByte(addr);
            _CPU.incProgCnt();
        }
        storeMem() {
            // let storeAddr16 = (this.PC).toString(16);
            _CPU.incProgCnt();
            let addr = parseInt((_MemoryAccessor.readByte(this.PC + 1) + _MemoryAccessor.readByte(this.PC)), 16);
            //addr = parseInt(_MemoryAccessor.readByte(this.PC) + addr,16).toString(16);
            _MemoryAccessor.writeByte(addr.toString(16), this.Acc);
            _CPU.incProgCnt();
            _CPU.incProgCnt();
        }
        addWCarry() {
            _CPU.incProgCnt();
            let addr = parseInt((_MemoryAccessor.readByte(this.PC + 1) + _MemoryAccessor.readByte(this.PC)), 16);
            let value = _MemoryAccessor.readByte(addr.toString(16));
            this.Acc = (parseInt(this.Acc, 16) + parseInt(value, 16)).toString(16);
            _CPU.incProgCnt();
            _CPU.incProgCnt();
        }
        loadXConst() {
            _CPU.incProgCnt();
            this.Xreg = _MemoryAccessor.readByte(this.PC);
            _CPU.incProgCnt();
        }
        loadXMem() {
            _CPU.incProgCnt();
            //let memAddr16 = (this.PC).toString(16);
            let addr = parseInt((_MemoryAccessor.readByte(this.PC + 1) + _MemoryAccessor.readByte(this.PC)), 16).toString(16);
            this.Xreg = _MemoryAccessor.readByte(addr);
            _CPU.incProgCnt();
            _CPU.incProgCnt();
        }
        loadYConst() {
            _CPU.incProgCnt();
            this.Yreg = _MemoryAccessor.readByte(this.PC);
            _CPU.incProgCnt();
        }
        loadYMem() {
            _CPU.incProgCnt();
            //let memAddr16 = (this.PC).toString(16);
            let addr = parseInt((_MemoryAccessor.readByte(this.PC + 1) + _MemoryAccessor.readByte(this.PC)), 16).toString(16);
            this.Yreg = _MemoryAccessor.readByte(addr);
            _CPU.incProgCnt();
            _CPU.incProgCnt();
        }
        compareX() {
            _CPU.incProgCnt();
            let addr = parseInt((_MemoryAccessor.readByte(this.PC + 1) + _MemoryAccessor.readByte(this.PC)), 16).toString(16);
            if (_MemoryAccessor.readByte(addr) === this.Xreg) {
                this.Zflag = "01";
            }
            else {
                this.Zflag = "00";
            }
            _CPU.incProgCnt();
            _CPU.incProgCnt();
        }
        branchNBytes() {
            _CPU.incProgCnt();
            let bytes = parseInt(_MemoryAccessor.readByte(this.PC), 16);
            if (this.Zflag === "00") {
                this.PC = (parseInt(this.PC, 16) + bytes).toString(16);
                if (parseInt(this.PC, 16) > MEM_LIMIT - 1) {
                    let rem = parseInt(this.PC, 16) % (MEM_LIMIT - 1);
                    this.PC = rem.toString(16);
                }
                console.log("Branched");
                _CPU.incProgCnt();
            }
            else {
                console.log("skipped branch");
                _CPU.incProgCnt();
            }
            // handling the looping issue
        }
        incByte() {
            _CPU.incProgCnt();
            let addr = parseInt((_MemoryAccessor.readByte(this.PC + 1) + _MemoryAccessor.readByte(this.PC)), 16).toString(16);
            let tempVal = parseInt(_MemoryAccessor.readByte(addr), 16);
            tempVal++;
            _MemoryAccessor.writeByte(addr, tempVal.toString(16));
            _CPU.incProgCnt();
            _CPU.incProgCnt();
        }
        systemCall() {
            if (this.Xreg === "01") {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PRINT_YREG_IRQ, [this.Yreg]));
            }
            else if (this.Xreg === "02") {
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PRINT_FROM_MEM_IRQ, [this.Yreg]));
            }
            _CPU.incProgCnt();
        }
        break() {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(END_PROC_IRQ, [_Scheduler.runningPID]));
        }
    }
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=cpu.js.map