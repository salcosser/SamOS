/* ------------
     Kernel.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */
var TSOS;
(function (TSOS) {
    class Kernel {
        //
        // OS Startup and Shutdown Routines
        //
        krnBootstrap() {
            TSOS.Control.hostLog("bootstrap", "host"); // Use hostLog because we ALWAYS want this, even if _Trace is off.
            // Initialize our global queues.
            _KernelInterruptQueue = new TSOS.Queue(); // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array(); // Buffers... for the kernel.
            _KernelInputQueue = new TSOS.Queue(); // Where device input lands before being processed out somewhere.
            // Initialize the console.
            _Console = new TSOS.Console(); // The command line interface / console I/O device.
            _Console.init();
            // Initialize standard input and output to the _Console.
            _StdIn = _Console;
            _StdOut = _Console;
            _HardDisk = new TSOS.HardDisk();
            _FileSystem = new TSOS.FileSystem();
            _DSDD = new TSOS.DSDD();
            _MemoryManager = new TSOS.MemoryManager();
            _Dispatcher = new TSOS.Dispatcher();
            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new TSOS.DeviceDriverKeyboard(); // Construct it.
            _krnKeyboardDriver.driverEntry(); // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);
            //
            // ... more?
            //
            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();
            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new TSOS.Shell();
            _OsShell.init();
            // Finally, initiate student testing protocol.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        }
        krnShutdown() {
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the Interrupts.
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();
            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace("end shutdown OS");
            clearInterval(_hardwareClockID);
        }
        krnOnCPUClockPulse() {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
               This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
               This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
               that it has to look for interrupts and process them if it finds any.
            */
            // Check for an interrupt, if there are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // Process the first interrupt on the interrupt queue.
                // TODO (maybe): Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            }
            else if (_CPU.isExecuting) { // If there are no interrupts then run one CPU cycle if there is anything being processed.
                _Mode = 0;
                _Scheduler.recessDuty();
                if (_CPU.isExecuting) { // did anything change?
                    _Mode = 1;
                    _CPU.cycle();
                }
                _Mode = 0;
                this.updatePCBInfo();
                this.updateMemViewer();
                this.updateProcViewer();
            }
            else { // If there are no interrupts and there is nothing being executed then just be idle.
                this.krnTrace("Idle");
            }
        }
        //
        // Interrupt Handling
        //
        krnEnableInterrupts() {
            // Keyboard
            TSOS.Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }
        krnDisableInterrupts() {
            // Keyboard
            TSOS.Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }
        krnInterruptHandler(irq, params) {
            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);
            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR(); // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params); // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                case END_PROC_IRQ:
                    _Scheduler.termProc(params[0]);
                    // _Scheduler.rrSync();
                    this.updateProcViewer();
                    _StdOut.advanceLine();
                    _StdOut.putText(`Program with pid ${params[0]} has ended`);
                    _StdOut.advanceLine();
                    _OsShell.putPrompt();
                    break;
                case KILL_PROC_IRQ:
                    _Scheduler.termRunningProc(params[0]);
                    this.updateProcViewer();
                    _StdOut.advanceLine();
                    _StdOut.putText(`Program with pid ${params[0]} has been stopped`);
                    _StdOut.advanceLine();
                    _OsShell.putPrompt();
                    break;
                case PRINT_YREG_IRQ:
                    _StdOut.putText(parseInt(params[0], 16).toString());
                    break;
                case PRINT_FROM_MEM_IRQ:
                    let addr = params[0];
                    let memVal = _MemoryManager.getMemory(addr);
                    let res = "";
                    while (memVal !== "00") {
                        res += String.fromCharCode(parseInt(memVal, 16));
                        addr = (parseInt(addr, 16) + 1).toString(16);
                        memVal = _MemoryManager.getMemory(addr).toString(16);
                    }
                    _StdOut.putText(res);
                    break;
                case FINISHED_PROC_QUEUE:
                    console.log("called end processing");
                    _CPU.isExecuting = false;
                    _Kernel.updateProcViewer();
                    _Scheduler.runningPID = -1;
                    _Kernel.clearCPU();
                    _Kernel.updatePCBInfo();
                    _StdOut.putText("All processes have completed.");
                    _StdOut.advanceLine();
                    _OsShell.putPrompt();
                    break;
                case MEM_BOUNDS_ERR_R:
                    _CPU.isExecuting = false;
                    this.krnTrapError(`Memory out of bounds error. proc with pid[${params[0]}] tried to read memory address ${params[1]}, which is ${params[2]} bytes outside of it's memory bounds.`);
                    break;
                case MEM_BOUNDS_ERR_W:
                    _CPU.isExecuting = false;
                    this.krnTrapError(`Memory out of bounds error. proc with pid[${params[0]}] tried to write to memory address ${params[1]}, which is ${params[2]} bytes outside of it's memory bounds.`);
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        }
        krnTimerISR() {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
            // Or do it elsewhere in the Kernel. We don't really need this.
        }
        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile
        //
        // OS Utility Routines
        //
        krnTrace(msg) {
            // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
            if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would quickly lag the browser quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        TSOS.Control.hostLog(msg, "OS");
                    }
                }
                else {
                    TSOS.Control.hostLog(msg, "OS");
                }
            }
        }
        updatePCBInfo() {
            document.getElementById("PC").innerHTML = _CPU.PC;
            document.getElementById("IR").innerHTML = _CPU.IR;
            document.getElementById("ACC").innerHTML = _CPU.Acc;
            document.getElementById("xReg").innerHTML = _CPU.Xreg;
            document.getElementById("yReg").innerHTML = _CPU.Yreg;
            document.getElementById("zFlg").innerHTML = _CPU.Zflag;
        }
        // used to update the memory viewer, as well as give an idea of where the program is in processing
        updateMemViewer() {
            let actualLocation = (parseInt(_CPU.PC, 16) + ((_MemoryManager.segAllocStatus.indexOf(_Scheduler.runningPID)) * 256)).toString(16);
            let realMemInd = 0;
            for (let i = 0; i < 32; i++) {
                for (let j = 1; j <= 8; j++) {
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].innerHTML = _MemoryManager.getMemoryPerSeg(realMemInd.toString(16), 0).toString(16);
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "lightgray";
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "normal";
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "black";
                    if (realMemInd.toString(16).toUpperCase() == actualLocation) {
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "bold";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "lightgreen";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "black";
                    }
                    realMemInd++;
                }
            }
            realMemInd = 0;
            for (let i = 32; i < 64; i++) {
                for (let j = 1; j <= 8; j++) {
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].innerHTML = _MemoryManager.getMemoryPerSeg(realMemInd.toString(16), 1).toString(16);
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "lightgray";
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "normal";
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "black";
                    if (realMemInd.toString(16).toUpperCase() == actualLocation) {
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "bold";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "lightgreen";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "black";
                    }
                    realMemInd++;
                }
            }
            realMemInd = 0;
            for (let i = 64; i < 96; i++) {
                for (let j = 1; j <= 8; j++) {
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].innerHTML = _MemoryManager.getMemoryPerSeg(realMemInd.toString(16), 2).toString(16);
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "lightgray";
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "normal";
                    document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "black";
                    if (realMemInd.toString(16).toUpperCase() == actualLocation) {
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.fontWeight = "bold";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.color = "lightgreen";
                        document.getElementById("memTableRows").getElementsByTagName("tr")[i].cells[j].style.backgroundColor = "black";
                    }
                    realMemInd++;
                }
            }
        }
        updateProcViewer() {
            let pcbSet = new Map();
            let rTable = document.getElementById("pcbTable");
            while (rTable.rows.length > 1) {
                rTable.rows[rTable.rows.length - 1].remove();
            }
            if (_Scheduler.runningPID != -1 && _Scheduler.readyQueue.getSize() >= 1) {
                let rPcb = new Map();
                rPcb.set("pid", _Scheduler.runningPID);
                rPcb.set("seg", _MemoryManager.segAllocStatus.indexOf(_Scheduler.runningPID));
                rPcb.set("pc", _CPU.PC);
                rPcb.set("ir", _CPU.IR);
                rPcb.set("acc", _CPU.Acc);
                rPcb.set("xr", _CPU.Xreg);
                rPcb.set("yr", _CPU.Yreg);
                rPcb.set("zf", _CPU.Zflag);
                rPcb.set("st", "Running");
                pcbSet.set(_Scheduler.runningPID, rPcb);
                // let rRow = rTable.insertRow(-1);
                // for(let i = 0;i<9;i++){
                //         rRow.insertCell(i);
                // }
                // rRow.cells[0].innerHTML = _Scheduler.runningPID;
                // rRow.cells[1].innerHTML = _MemoryManager.segAllocStatus.indexOf(_Scheduler.runningPID);
                // rRow.cells[2].innerHTML = _CPU.PC;
                // rRow.cells[3].innerHTML = _CPU.IR;
                // rRow.cells[4].innerHTML = _CPU.Acc;
                // rRow.cells[5].innerHTML = _CPU.Xreg;
                // rRow.cells[6].innerHTML = _CPU.Yreg;
                // rRow.cells[7].innerHTML = _CPU.Zflag;
                // rRow.cells[8].innerHTML = "Running";
                // rRow.style.backgroundColor = "rgba(230, 114, 100, 0.65)";
            }
            for (let pcb of _Scheduler.readyQueue.q) {
                // let table = document.getElementById("pcbTable");
                // let row = table.insertRow(-1);
                // for(let i = 0;i<9;i++){
                //     row.insertCell(i);
                // }
                let rdPcb = new Map();
                rdPcb.set("pid", pcb.pid);
                if (_MemoryManager.segAllocStatus.indexOf(pcb.pid) != -1) {
                    rdPcb.set("seg", _MemoryManager.segAllocStatus.indexOf(pcb.pid));
                }
                else {
                    rdPcb.set("seg", "N/A");
                }
                rdPcb.set("pc", pcb.PC);
                rdPcb.set("ir", pcb.IR);
                rdPcb.set("acc", pcb.Acc);
                rdPcb.set("xr", pcb.xReg);
                rdPcb.set("yr", pcb.yReg);
                rdPcb.set("zf", pcb.zFlag);
                let state = "Ready";
                switch (pcb.state) {
                    case RESIDENT:
                        state = "Resident";
                        break;
                    case READY:
                        state = "Ready";
                        break;
                    case RUNNING:
                        state = "Running";
                        break;
                    case WAITING:
                        state = "Waiting";
                        break;
                    case TERMINATED:
                        state = "Terminated";
                        break;
                    default:
                    //
                }
                rdPcb.set("st", state);
                pcbSet.set(pcb.pid, rdPcb);
            }
            let keySet = Array.from(pcbSet.keys());
            keySet.sort();
            for (let key of keySet) {
                let nRowData = pcbSet.get(key);
                let rRow = rTable.insertRow(-1);
                for (let i = 0; i < 9; i++) {
                    rRow.insertCell(i);
                }
                rRow.cells[0].innerHTML = nRowData.get("pid");
                rRow.cells[1].innerHTML = nRowData.get("seg");
                rRow.cells[2].innerHTML = nRowData.get("pc");
                rRow.cells[3].innerHTML = nRowData.get("ir");
                rRow.cells[4].innerHTML = nRowData.get("acc");
                rRow.cells[5].innerHTML = nRowData.get("xr");
                rRow.cells[6].innerHTML = nRowData.get("yr");
                rRow.cells[7].innerHTML = nRowData.get("zf");
                rRow.cells[8].innerHTML = nRowData.get("st");
                if (nRowData.get("st") == "Running") {
                    rRow.style.backgroundColor = "rgba(230, 114, 100, 0.65)";
                }
            }
            //pcbTable
        }
        clearCPU() {
            _CPU.PC = "00";
            _CPU.Acc = "00";
            _CPU.Xreg = "00";
            _CPU.Yreg = "00";
            _CPU.IR = "00";
            _CPU.Zflag = "00";
            _CPU.isExecuting = false;
        }
        krnTrapError(msg) {
            TSOS.Control.hostLog("OS ERROR - TRAP: " + msg);
            // TODO: Display error on console, perhaps in some sort of colored screen. (Maybe blue?)
            _StdOut.clearScreen();
            _StdOut.resetXY();
            _DrawingContext.fillStyle = "white";
            document.getElementById("display").style.backgroundColor = "blue"; //putting the B in BSOD
            _StdOut.putText(msg + " - A Fatal Error has occured.");
            alert("What did you do!!!!!!");
            _Kernel.krnShutdown();
        }
    }
    TSOS.Kernel = Kernel;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=kernel.js.map